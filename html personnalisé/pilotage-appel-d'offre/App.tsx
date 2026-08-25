
import React, { useState, useCallback } from 'react';
import PdfUpload from './components/PdfUpload';
import RetroPlanning from './components/RetroPlanning';
import Chatbot from './components/Chatbot';
import Dashboard from './components/Dashboard';
import { ExtractedPdf, GeminiDateExtractionResponse, RetroPlanningData, TenderPlanningItem, LaunchSummaryReport, RiskReport, ScoringCriteriaReport, ManualTask } from './types';
import { extractDatesFromDCE, generateLaunchSummary, generateRiskReport, generateScoringCriteriaReport } from './services/geminiService';
import { TENDER_TASK_DEFINITIONS, TASK_SECTIONS } from './constants';
import { addWorkingDays, parseYYYYMMDDToDate } from './utils/dateUtils';

type ActiveView = 'upload' | 'planning' | 'chatbot' | 'dashboard';

const DALKIA_LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAiPgogICAgPHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjMDAyRDYyIi8+CiAgICA8cmVjdCB4PSIzNSIgeT0iMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRjA2QTAwIi8+CiAgICA8dGV4dCB4PSI3MCIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzAwMkQ2MiI+RGFsa2lhPC90ZXh0Pgo8L3N2Zz4K';


function App() {
  const [activeView, setActiveView] = useState<ActiveView>('upload');
  const [extractedPdfs, setExtractedPdfs] = useState<ExtractedPdf[]>([]);
  const [combinedPdfText, setCombinedPdfText] = useState<string | null>(null);
  const [planningData, setPlanningData] = useState<RetroPlanningData | null>(null);
  const [planningError, setPlanningError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // General loading for main processes

  // States for Dashboard reports
  const [launchSummary, setLaunchSummary] = useState<LaunchSummaryReport | null>(null);
  const [riskReport, setRiskReport] = useState<RiskReport | null>(null);
  const [scoringCriteriaReport, setScoringCriteriaReport] = useState<ScoringCriteriaReport | null>(null);

  const [isLoadingLaunchSummary, setIsLoadingLaunchSummary] = useState(false);
  const [isLoadingRiskReport, setIsLoadingRiskReport] = useState(false);
  const [isLoadingScoringCriteria, setIsLoadingScoringCriteria] = useState(false);

  const [errorLaunchSummary, setErrorLaunchSummary] = useState<string | null>(null);
  const [errorRiskReport, setErrorRiskReport] = useState<string | null>(null);
  const [errorScoringCriteria, setErrorScoringCriteria] = useState<string | null>(null);


  // New states to store Gemini extracted dates and user-modified task data
  const [geminiExtractedDates, setGeminiExtractedDates] = useState<GeminiDateExtractionResponse | null>(null);
  const [customTaskDurations, setCustomTaskDurations] = useState<{[taskId: string]: number}>({});
  const [savedTaskDetails, setSavedTaskDetails] = useState<{ [taskId: string]: { responsible: string, comments: string } }>({});
  const [manualTasks, setManualTasks] = useState<ManualTask[]>([]);

  /**
   * Generates retro-planning data based on extracted dates, custom durations, and saved task details.
   * This function performs the core retro-planning logic, calculating start and end dates for all tasks.
   * It is designed to be re-run whenever relevant inputs (dates, durations, details) change without re-calling Gemini.
   */
  const generateRetroPlanningData = useCallback((
    submissionDeadlineStr: string,
    extractedDates: GeminiDateExtractionResponse,
    currentCustomDurations: { [taskId: string]: number },
    currentSavedTaskDetails: { [taskId: string]: { responsible: string, comments: string } },
    currentManualTasks: ManualTask[]
  ): RetroPlanningData => {
    const submissionDeadline = parseYYYYMMDDToDate(submissionDeadlineStr);
    const tasksMap = new Map<string, TenderPlanningItem>();

    // 1. Initialize tasks with base definitions, apply custom durations and saved details
    const baseTasks: TenderPlanningItem[] = TENDER_TASK_DEFINITIONS.map(taskDef => {
      const effectiveDuration = currentCustomDurations[taskDef.id] !== undefined ? currentCustomDurations[taskDef.id] : taskDef.estimatedDurationDays;
      return {
        ...taskDef,
        estimatedDurationDays: effectiveDuration,
        level: 0, // Placeholder, will calculate below
        isParent: TENDER_TASK_DEFINITIONS.some(t => t.parentId === taskDef.id), // Determine if it's a parent
        startDate: null,
        endDate: null,
        responsible: currentSavedTaskDetails[taskDef.id]?.responsible || '',
        comments: currentSavedTaskDetails[taskDef.id]?.comments || '',
      };
    });

    // Add manual tasks, converting them to TenderPlanningItem structure
    const manualPlanningItems: TenderPlanningItem[] = currentManualTasks.map(mTask => {
      const parentSection = TASK_SECTIONS.find(section => section.id === mTask.sectionId);
      return {
        id: mTask.id,
        name: mTask.name,
        parentId: mTask.sectionId, // Manual tasks are children of their selected section
        startDate: null,
        endDate: null,
        estimatedDurationDays: mTask.estimatedDurationDays,
        level: 0, // Will be calculated
        isParent: false, // Manual tasks are always leaf nodes
        responsible: mTask.responsible || '',
        comments: mTask.comments || '',
        isManual: true,
      };
    });

    const allTasksRaw: TenderPlanningItem[] = [...baseTasks, ...manualPlanningItems];
    const allTasksWithSections: TenderPlanningItem[] = [...allTasksRaw];

    // Add TASK_SECTIONS as parent tasks if they are not already in baseTasks and have children
    TASK_SECTIONS.forEach(section => {
      const isAlreadyBaseTask = baseTasks.some(t => t.id === section.id);
      const hasChildren = allTasksRaw.some(t => t.parentId === section.id);

      if (!isAlreadyBaseTask && hasChildren) {
        allTasksWithSections.push({
          id: section.id,
          name: section.name,
          estimatedDurationDays: 0, // Sections themselves have 0 duration
          level: 0, // Placeholder, will calculate below
          isParent: true,
          startDate: null,
          endDate: null,
          responsible: '',
          comments: '',
        });
      }
    });

    // Populate map for quick access and calculate hierarchical levels
    const calculateLevel = (task: TenderPlanningItem, currentLevel: number): number => {
      if (!task.parentId) return currentLevel;
      const parent = allTasksWithSections.find(t => t.id === task.parentId);
      if (parent) {
        return calculateLevel(parent, currentLevel + 1);
      }
      return currentLevel;
    };
    allTasksWithSections.forEach(task => {
      task.level = calculateLevel(task, 0);
      tasksMap.set(task.id, task);
    });



    // Create a map to track which tasks have had their dates set
    const tasksWithDatesSet = new Set<string>();

    // 2. Set fixed points in time: Submission, Site Visit, Launch Meeting
    // These tasks' dates are directly determined by external factors (Gemini extraction, project deadline)

    const submissionTask = tasksMap.get('9'); // Assuming 'Remise Offre' has ID '9'
    if (submissionTask) {
      submissionTask.endDate = new Date(submissionDeadline);
      submissionTask.startDate = addWorkingDays(new Date(submissionDeadline), -(submissionTask.estimatedDurationDays - 1));
      tasksWithDatesSet.add(submissionTask.id);
    }

    if (extractedDates.siteVisitDate) {
      const siteVisitDate = parseYYYYMMDDToDate(extractedDates.siteVisitDate);
      const siteVisitTask = tasksMap.get('1.3'); // Assuming 'Visites de sites' has ID '1.3'
      if (siteVisitTask) {
        siteVisitTask.startDate = siteVisitDate;
        siteVisitTask.endDate = addWorkingDays(siteVisitDate, siteVisitTask.estimatedDurationDays - 1);
        tasksWithDatesSet.add(siteVisitTask.id);
      }
    }
    if (extractedDates.launchMeetingDate) {
      const launchMeetingDate = parseYYYYMMDDToDate(extractedDates.launchMeetingDate);
      const launchMeetingTask = tasksMap.get('1.2'); // Assuming 'Réunion de lancement' has ID '1.2'
      if (launchMeetingTask) {
        launchMeetingTask.startDate = launchMeetingDate;
        launchMeetingTask.endDate = addWorkingDays(launchMeetingDate, launchMeetingTask.estimatedDurationDays - 1);
        tasksWithDatesSet.add(launchMeetingTask.id);
      }
    }

    // 3. Backward pass to calculate dates for non-parent, non-fixed tasks
    // We iterate from the end of the sorted tasks list (logical end of project) backwards.
    // This allows us to propagate dates correctly, as a task's end date is often tied to the start date of the
    // next chronological task (which is the previous in our reverse iteration).
    let currentWorkCursor = new Date(submissionDeadline); // This cursor tracks the latest start date of the "next" task in chronological order.

    // To handle sequential tasks within groups and propagate dates backwards:
    // We need to group tasks by parent and iterate through these groups.
    const groupedTasks = new Map<string | undefined, TenderPlanningItem[]>();
    allTasksWithSections.forEach(task => {
        const parentId = task.parentId;
        if (!groupedTasks.has(parentId)) {
            groupedTasks.set(parentId, []);
        }
        groupedTasks.get(parentId)?.push(task);
    });

    // Process tasks starting from the top-level (no parent) and going down.
    // Within each group, process tasks in reverse order (from latest ID to earliest ID for backward planning).
    const processGroup = (parentId: string | undefined, currentEndDateForGroup: Date) => {
        const tasksInGroup = groupedTasks.get(parentId)?.filter(t => !tasksWithDatesSet.has(t.id)) || [];
        tasksInGroup.sort((a, b) => b.id.localeCompare(a.id)); // Process in reverse ID order for backward fill

        for (const task of tasksInGroup) {
            if (task.isParent) {
                // If it's a parent, its duration is 0, dates are rollup of children.
                // We'll calculate parent dates in a separate pass after children are processed.
                // For now, it doesn't consume time, so the cursor isn't affected.
                // Its children will be processed recursively if not already.
                processGroup(task.id, currentEndDateForGroup); // Recurse for children
                // After processing children, determine effective end date for this parent in this backward pass
                const childrenWithDates = allTasksWithSections.filter(c => c.parentId === task.id && c.startDate && c.endDate);
                if (childrenWithDates.length > 0) {
                    const earliestChildStart = childrenWithDates.reduce((minDate, child) =>
                        (child.startDate && (!minDate || child.startDate.getTime() < minDate.getTime())) ? child.startDate : minDate
                    , currentEndDateForGroup); // Fallback to current group end
                    
                    if (earliestChildStart.getTime() < currentEndDateForGroup.getTime()) {
                        currentEndDateForGroup = earliestChildStart;
                    }
                }
                
            } else {
                // Regular task
                task.endDate = addWorkingDays(currentEndDateForGroup, -1);
                task.startDate = addWorkingDays(task.endDate, -(task.estimatedDurationDays - 1));
                currentEndDateForGroup = task.startDate; // This task's start becomes the end for the preceding task
                tasksWithDatesSet.add(task.id);
            }
        }
        return currentEndDateForGroup; // Return the updated cursor for tasks preceding this group
    };

    // Start processing from top-level tasks (no parent)
    currentWorkCursor = processGroup(undefined, currentWorkCursor);

    // After the initial backward pass, ensure all parent tasks have their dates properly rolled up from their children.
    // This requires iterating from the earliest tasks (lowest ID) forward.
    const finalTasksForDisplay: TenderPlanningItem[] = [];
    const childrenOf = new Map<string | undefined, TenderPlanningItem[]>();

    allTasksWithSections.forEach(task => {
      const parentId = task.parentId;
      if (!childrenOf.has(parentId)) {
        childrenOf.set(parentId, []);
      }
      childrenOf.get(parentId)?.push(task);
    });

    // Sort children within each group: manual first, then by ID
    childrenOf.forEach((children, parentId) => {
      children.sort((a, b) => {
        if (a.isManual && !b.isManual) return -1; // Manual comes before non-manual
        if (!a.isManual && b.isManual) return 1;  // Non-manual comes after manual
        return a.id.localeCompare(b.id); // Otherwise, sort by ID
      });
    });

    // Recursive function to add tasks in hierarchical order
    const addTasksInOrder = (parentId: string | undefined) => {
      const children = childrenOf.get(parentId) || [];
      for (const task of children) {
        finalTasksForDisplay.push(task);
        // Check if it's a parent or has children to recurse
        if (task.isParent || allTasksWithSections.some(t => t.parentId === task.id)) {
          addTasksInOrder(task.id);
        }
      }
    };

    // Start with top-level tasks (those with no parentId)
    // Sort these top-level tasks by their ID (which corresponds to TASK_SECTIONS order)
    const topLevelTasks = allTasksWithSections.filter(task => !task.parentId);
    topLevelTasks.sort((a, b) => a.id.localeCompare(b.id));

    for (const topTask of topLevelTasks) {
      finalTasksForDisplay.push(topTask);
      addTasksInOrder(topTask.id);
    }

    for (const task of finalTasksForDisplay) {
      if (task.isParent) {
        const children = finalTasksForDisplay.filter(c => c.parentId === task.id && c.startDate && c.endDate);
        if (children.length > 0) {
          const earliestChildStart = children.reduce((minDate, child) =>
            (child.startDate && (!minDate || child.startDate.getTime() < minDate.getTime())) ? child.startDate : minDate
          , new Date(8640000000000000)); // Max Date
          const latestChildEnd = children.reduce((maxDate, child) =>
            (child.endDate && (!maxDate || child.endDate.getTime() > maxDate.getTime())) ? child.endDate : maxDate
          , new Date(-8640000000000000)); // Min Date

          task.startDate = (earliestChildStart.getTime() !== 8640000000000000) ? earliestChildStart : null;
          task.endDate = (latestChildEnd.getTime() !== -8640000000000000) ? latestChildEnd : null;
        } else {
          // If a parent has no children (e.g., initial setup issue or filtered) and 0 duration,
          // its dates should be null, as it's a grouping element without its own time.
          task.startDate = null;
          task.endDate = null;
        }
      }
    }


    // Determine overall planning start and end dates based on all calculated tasks
    const effectivePlanningStart = finalTasksForDisplay.reduce((minDate, task) =>
      (task.startDate && (!minDate || task.startDate.getTime() < minDate.getTime())) ? task.startDate : minDate
    , submissionDeadline); // Default to submission deadline if no tasks have start dates

    const effectivePlanningEnd = finalTasksForDisplay.reduce((maxDate, task) =>
      (task.endDate && (!maxDate || task.endDate.getTime() > maxDate.getTime())) ? task.endDate : maxDate
    , submissionDeadline); // Default to submission deadline if no tasks have end dates

    const oneDay = 24 * 60 * 60 * 1000;
    const diffDays = Math.round(Math.abs((effectivePlanningEnd.getTime() - effectivePlanningStart.getTime()) / oneDay));
    const numWeeks = Math.ceil(diffDays / 7) + 1; // +1 to ensure the current (partial) week is counted

    return {
      weeklyTasks: {}, // Not directly used in current display logic but kept for type consistency
      allTasks: finalTasksForDisplay,
      startDate: effectivePlanningStart,
      endDate: effectivePlanningEnd,
      numWeeks: numWeeks,
    };
  }, [addWorkingDays, parseYYYYMMDDToDate, TENDER_TASK_DEFINITIONS, TASK_SECTIONS]);


  /**
   * Handles the processing of uploaded PDFs. Extracts text, calls Gemini for key dates,
   * and then generates the initial retro-planning.
   */
  const handlePdfsProcessed = useCallback(async (pdfs: ExtractedPdf[], combinedText: string) => {
    setIsLoading(true);
    setExtractedPdfs(pdfs);
    setCombinedPdfText(combinedText);
    setPlanningError(null);

    // Reset all report data and errors
    setLaunchSummary(null);
    setRiskReport(null);
    setScoringCriteriaReport(null);
    setErrorLaunchSummary(null);
    setErrorRiskReport(null);
    setErrorScoringCriteria(null);
    setCustomTaskDurations({});
    setSavedTaskDetails({});
    setManualTasks([]);

    try {
      // 1. Extract Dates
      const dates = await extractDatesFromDCE(combinedText);
      setGeminiExtractedDates(dates);

      // 2. Generate Planning Data
      const newPlanningData = generateRetroPlanningData(
        dates.submissionDeadline,
        dates,
        {}, // Initial custom durations are empty
        {}, // Initial saved task details are empty
        manualTasks // Initial manual tasks are empty
      );
      setPlanningData(newPlanningData);

      // 3. Generate Dashboard Reports in parallel
      setIsLoadingLaunchSummary(true);
      setIsLoadingRiskReport(true);
      setIsLoadingScoringCriteria(true);

      const [launchSummaryResult, riskReportResult, scoringCriteriaResult] = await Promise.allSettled([
        generateLaunchSummary(combinedText),
        generateRiskReport(combinedText),
        generateScoringCriteriaReport(combinedText),
      ]);

      if (launchSummaryResult.status === 'fulfilled') {
        setLaunchSummary(launchSummaryResult.value);
      } else {
        console.error('Error generating launch summary:', launchSummaryResult.reason);
        setErrorLaunchSummary(`Échec de la génération de la synthèse de lancement : ${launchSummaryResult.reason?.message || 'Unknown error'}`);
      }
      setIsLoadingLaunchSummary(false);

      if (riskReportResult.status === 'fulfilled') {
        setRiskReport(riskReportResult.value);
      } else {
        console.error('Error generating risk report:', riskReportResult.reason);
        setErrorRiskReport(`Échec de la génération de la note de couverture : ${riskReportResult.reason?.message || 'Unknown error'}`);
      }
      setIsLoadingRiskReport(false);

      if (scoringCriteriaResult.status === 'fulfilled') {
        setScoringCriteriaReport(scoringCriteriaResult.value);
      } else {
        console.error('Error generating scoring criteria report:', scoringCriteriaResult.reason);
        setErrorScoringCriteria(`Échec de l'extraction des critères de notation : ${scoringCriteriaResult.reason?.message || 'Unknown error'}`);
      }
      setIsLoadingScoringCriteria(false);

      setActiveView('planning'); // Navigate to planning after initial processing

    } catch (error: any) {
      console.error('General error during PDF processing and report generation:', error);
      setPlanningError(`Échec global du traitement: ${error.message || 'Unknown error'}`);
      // Ensure all loading states are reset even on general failure
      setIsLoadingLaunchSummary(false);
      setIsLoadingRiskReport(false);
      setIsLoadingScoringCriteria(false);
    } finally {
      setIsLoading(false); // Reset overall loading state
    }
  }, [extractDatesFromDCE, generateRetroPlanningData, manualTasks]); // Dependencies for useCallback

  /**
   * Handles updating a task's estimated duration. Recalculates the retro-planning locally.
   */
  const handleUpdateTaskDuration = useCallback((taskId: string, newDuration: number) => {
    const updatedCustomDurations = {
      ...customTaskDurations,
      [taskId]: newDuration,
    };
    setCustomTaskDurations(updatedCustomDurations);

    // Recalculate planning using the stored Gemini dates and the updated custom durations
    if (geminiExtractedDates && geminiExtractedDates.submissionDeadline) {
      const newPlanningData = generateRetroPlanningData(
        geminiExtractedDates.submissionDeadline,
        geminiExtractedDates,
        updatedCustomDurations,
        savedTaskDetails, // Pass current saved details
        manualTasks // Pass current manual tasks
      );
      setPlanningData(newPlanningData);
    }
  }, [geminiExtractedDates, customTaskDurations, generateRetroPlanningData, savedTaskDetails]); // Dependencies for useCallback

  /**
   * Handles saving the responsible person and comments for tasks. Recalculates the planning
   * to reflect these changes in the task objects.
   */
  const handleSaveTaskDetails = useCallback((updates: { [taskId: string]: { responsible: string, comments: string } }) => {
    const updatedSavedTaskDetails = { ...savedTaskDetails, ...updates };
    setSavedTaskDetails(updatedSavedTaskDetails);

    // Re-generate planning to ensure the 'responsible' and 'comments' fields in `planningData.allTasks` are updated.
    // This doesn't affect dates but ensures the displayed data is fresh.
    if (geminiExtractedDates && geminiExtractedDates.submissionDeadline) {
        const newPlanningData = generateRetroPlanningData(
            geminiExtractedDates.submissionDeadline,
            geminiExtractedDates,
            customTaskDurations, // Use current custom durations
            updatedSavedTaskDetails, // Pass the newly updated saved details
            manualTasks // Pass current manual tasks
        );
        setPlanningData(newPlanningData);
    }
  }, [geminiExtractedDates, customTaskDurations, generateRetroPlanningData, savedTaskDetails]); // Dependencies for useCallback


  /**
   * Adds a new manual task to the planning.
   */
  const handleAddManualTask = useCallback((newTask: ManualTask) => {
    setManualTasks(prevTasks => [...prevTasks, newTask]);

    // Re-generate planning to incorporate the new manual task
    if (geminiExtractedDates && geminiExtractedDates.submissionDeadline) {
      const newPlanningData = generateRetroPlanningData(
        geminiExtractedDates.submissionDeadline,
        geminiExtractedDates,
        customTaskDurations,
        savedTaskDetails,
        [...manualTasks, newTask] // Pass the updated list including the new task
      );
      setPlanningData(newPlanningData);
    }
  }, [geminiExtractedDates, customTaskDurations, generateRetroPlanningData, savedTaskDetails, manualTasks]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-[#002D62] p-4 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <img src={DALKIA_LOGO_BASE64} alt="Dalkia Logo" className="h-8" />
            <span className="text-white text-3xl font-bold">Offer Assistant</span>
          </div>
          <div className="space-x-4">
            <button
              onClick={() => setActiveView('upload')}
              className={`py-2 px-5 rounded-lg text-lg font-semibold transition-colors duration-200
                ${activeView === 'upload' ? 'bg-[#F06A00] text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'}`}
            >
              Upload PDF
            </button>
            <button
              onClick={() => setActiveView('planning')}
              disabled={!planningData}
              className={`py-2 px-5 rounded-lg text-lg font-semibold transition-colors duration-200
                ${activeView === 'planning' ? 'bg-[#F06A00] text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'}
                ${!planningData ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Retro-planning
            </button>
            <button
              onClick={() => setActiveView('chatbot')}
              disabled={!combinedPdfText}
              className={`py-2 px-5 rounded-lg text-lg font-semibold transition-colors duration-200
                ${activeView === 'chatbot' ? 'bg-[#F06A00] text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'}
                ${!combinedPdfText ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Chatbot
            </button>
            <button
              onClick={() => setActiveView('dashboard')}
              disabled={!combinedPdfText}
              className={`py-2 px-5 rounded-lg text-lg font-semibold transition-colors duration-200
                ${activeView === 'dashboard' ? 'bg-[#F06A00] text-white' : 'text-gray-200 hover:bg-gray-700 hover:text-white'}
                ${!combinedPdfText ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto p-8 flex-grow">
        {activeView === 'upload' && (
          <PdfUpload onPdfsProcessed={handlePdfsProcessed} isLoading={isLoading} />
        )}
        {activeView === 'planning' && (
          <RetroPlanning
            planningData={planningData}
            isLoading={isLoading}
            error={planningError}
            onSaveTaskDetails={handleSaveTaskDetails}
            onUpdateTaskDuration={handleUpdateTaskDuration}
            onAddManualTask={handleAddManualTask}
          />
        )}
        {activeView === 'chatbot' && (
          <Chatbot combinedPdfText={combinedPdfText} globalIsLoading={isLoading} />
        )}
        {activeView === 'dashboard' && (
          <Dashboard
            combinedPdfText={combinedPdfText}
            globalIsLoading={isLoading}
            launchSummary={launchSummary}
            riskReport={riskReport}
            scoringCriteriaReport={scoringCriteriaReport}
            isLoadingLaunchSummary={isLoadingLaunchSummary}
            isLoadingRiskReport={isLoadingRiskReport}
            isLoadingScoringCriteria={isLoadingScoringCriteria}
            errorLaunchSummary={errorLaunchSummary}
            errorRiskReport={errorRiskReport}
            errorScoringCriteria={errorScoringCriteria}
          />
        )}
      </main>

      <footer className="bg-[#002D62] text-white p-4 text-center mt-auto shadow-inner">
        <p>&copy; {new Date().getFullYear()} Dalkia Offer Assistant. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;