import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RetroPlanningData, TenderPlanningItem, ManualTask } from '../types';
import { TASK_SECTIONS } from '../constants';
import { getWeekNumber, formatDateToYYYYMMDD, addWorkingDays } from '../utils/dateUtils';

// Declare html2pdf globally since it's loaded via CDN.
declare global {
  interface Window {
    html2pdf: any;
  }
}

interface RetroPlanningProps {
  planningData: RetroPlanningData | null;
  isLoading: boolean;
  error: string | null;
  onSaveTaskDetails: (updates: { [taskId: string]: { responsible: string, comments: string } }) => void;
  onUpdateTaskDuration: (taskId: string, newDuration: number) => void; // New prop for updating task duration
  onAddManualTask: (newTask: ManualTask) => void; // New prop for adding manual tasks
}

const RetroPlanning: React.FC<RetroPlanningProps> = ({ planningData, isLoading, error, onSaveTaskDetails, onUpdateTaskDuration, onAddManualTask }) => {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(1);
  const [newTaskSectionId, setNewTaskSectionId] = useState(TASK_SECTIONS[0]?.id || '');
  const [newTaskResponsible, setNewTaskResponsible] = useState('');
  const [newTaskComments, setNewTaskComments] = useState('');
  const [editedTaskDetails, setEditedTaskDetails] = useState<{ [taskId: string]: { responsible: string, comments: string } }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const retroPlanningTableRef = useRef<HTMLDivElement>(null); // Ref for the div containing the table

  // Initialize editedTaskDetails when planningData changes
  useEffect(() => {
    if (planningData && planningData.allTasks) {
      const initialDetails = planningData.allTasks.reduce((acc, task) => {
        acc[task.id] = {
          responsible: task.responsible || '',
          comments: task.comments || '',
        };
        return acc;
      }, {});
      setEditedTaskDetails(initialDetails);
      setHasChanges(false); // Reset changes status
    }
  }, [planningData]);

  const handleDetailChange = useCallback((taskId: string, field: 'responsible' | 'comments', value: string) => {
    setEditedTaskDetails(prev => {
      const newDetails = {
        ...prev,
        [taskId]: {
          ...prev[taskId],
          [field]: value,
        },
      };
      setHasChanges(true); // Indicate that changes have been made
      return newDetails;
    });
  }, []);

  const handleSave = useCallback(() => {
    onSaveTaskDetails(editedTaskDetails);
    setHasChanges(false);
  }, [editedTaskDetails, onSaveTaskDetails]);

  const handleAddTask = useCallback(() => {
    if (!newTaskName.trim()) {
      alert('Le nom de la tâche est requis.');
      return;
    }

    const newTask: ManualTask = {
      id: `manual-${Date.now()}`,
      name: newTaskName.trim(),
      estimatedDurationDays: newTaskDuration,
      sectionId: newTaskSectionId,
      responsible: newTaskResponsible.trim(),
      comments: newTaskComments.trim(),
    };

    onAddManualTask(newTask);
    setShowAddTaskModal(false);
    setNewTaskName('');
    setNewTaskDuration(1);
    setNewTaskSectionId(TASK_SECTIONS[0]?.id || '');
    setNewTaskResponsible('');
    setNewTaskComments('');
  }, [newTaskName, newTaskDuration, newTaskSectionId, newTaskResponsible, newTaskComments, onAddManualTask]);

  const handleDurationChange = useCallback((taskId: string, currentDuration: number, delta: number) => {
    const newDuration = Math.max(0, currentDuration + delta); // Ensure duration doesn't go below 0
    if (newDuration !== currentDuration) {
      onUpdateTaskDuration(taskId, newDuration);
    }
  }, [onUpdateTaskDuration]);

  const isTaskActiveOnDate = useCallback((task: TenderPlanningItem, checkDate: Date): boolean => {
    if (!task.startDate || !task.endDate) return false;

    const taskStart = new Date(task.startDate);
    taskStart.setHours(0, 0, 0, 0);
    const taskEnd = new Date(task.endDate);
    taskEnd.setHours(23, 59, 59, 999);

    const checkDayStart = new Date(checkDate);
    checkDayStart.setHours(0, 0, 0, 0);
    const checkDayEnd = new Date(checkDate);
    checkDayEnd.setHours(23, 59, 59, 999);

    return checkDayStart <= taskEnd && checkDayEnd >= taskStart;
  }, []);

  const exportToPdf = useCallback(async () => {
    if (!retroPlanningTableRef.current) {
        alert("Contenu du planning introuvable pour l'export PDF.");
        return;
    }

    // Clone the table container to manipulate it for PDF export without affecting the live DOM
    const originalTableContainer = retroPlanningTableRef.current;
    const clonedElement = originalTableContainer.cloneNode(true) as HTMLDivElement;

    // Apply print-specific styles to the cloned element
    clonedElement.style.overflowX = 'visible'; // Allow content to overflow for printing
    clonedElement.style.width = '100%'; // Ensure full width is captured
    clonedElement.style.height = 'auto'; // Auto height

    // Adjust table element styles directly within the clone
    const table = clonedElement.querySelector('table');
    if (table) {
        table.style.minWidth = 'unset'; // Remove min-width that might force scroll
        table.style.width = 'auto'; // Let content dictate width
    }

    // Remove sticky positioning and min-widths from headers and cells for print
    const stickyElements = clonedElement.querySelectorAll('.sticky');
    stickyElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.position = 'static';
        htmlEl.style.left = 'auto';
        htmlEl.style.minWidth = 'auto';
        htmlEl.style.backgroundColor = '#f3f4f6'; // Ensure header background is not transparent
        htmlEl.style.borderRight = '1px solid #e5e7eb'; // Re-add borders if removed by sticky
    });

    // Remove fixed widths from th/td elements to allow content to flow naturally in PDF
    const fixedWidthElements = clonedElement.querySelectorAll('th[style*="min-width"], td[style*="min-width"]');
    fixedWidthElements.forEach(el => {
        (el as HTMLElement).style.minWidth = 'auto';
    });

    // Ensure all th elements have auto min-width and width to prevent overflow
    const allThElements = clonedElement.querySelectorAll('th');
    allThElements.forEach(el => {
        (el as HTMLElement).style.minWidth = 'auto';
        (el as HTMLElement).style.width = 'auto';
    });
    
    // Replace inputs/textareas with their current text values
    const inputs = clonedElement.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        const textNode = document.createTextNode((input as HTMLInputElement).value);
        input.parentNode?.replaceChild(textNode, input);
    });

    const textareas = clonedElement.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        const textNode = document.createTextNode((textarea as HTMLTextAreaElement).value);
        textarea.parentNode?.replaceChild(textNode, textarea);
    });

    // Remove duration buttons, keeping only the number
    const durationControls = clonedElement.querySelectorAll('.flex.items-center.justify-center.space-x-1');
    durationControls.forEach(div => {
        const span = div.querySelector('span');
        if (span && div.parentNode) {
            // Replace the entire div with just the span's text content
            div.parentNode.replaceChild(document.createTextNode(span.textContent || ''), div);
        } else if (div.parentNode) {
            div.parentNode.removeChild(div);
        }
    });

    // Place the cloned element off-screen for html2pdf to process
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = 'max-content'; // Crucial for wide tables
    tempDiv.appendChild(clonedElement);
    document.body.appendChild(tempDiv);

    const options = {
        margin: [10, 10, 10, 10], // top, left, bottom, right in mm
        filename: `RetroPlanning_${formatDateToYYYYMMDD(new Date())}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1, logging: false, dpi: 192, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }, // A3 landscape for better table fitting
        pagebreak: { mode: 'avoid-all', after: '.page-break' }, // Try to avoid breaking rows
    };

    try {
        await window.html2pdf().set(options).from(clonedElement).save();
    } catch (err) {
        console.error("Erreur lors de la génération du PDF:", err);
        alert("Une erreur est survenue lors de la génération du PDF. Veuillez réessayer.");
    } finally {
        document.body.removeChild(tempDiv); // Clean up the temporary element
    }
  }, [planningData, editedTaskDetails, isTaskActiveOnDate]); // Dependencies for useCallback

  if (isLoading) {
    return (
      <div className="text-center p-8 text-2xl text-[#002D62] font-semibold">
        Génération du rétro-planning en cours...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-2xl text-red-600 font-semibold">
        Erreur lors de la génération du planning: {error}
      </div>
    );
  }

  if (!planningData || !planningData.startDate || !planningData.endDate || planningData.numWeeks === 0 || planningData.allTasks.length === 0) {
    return (
      <div className="text-center p-8 text-2xl text-gray-500">
        Uploadez des fichiers PDF sur la page d'accueil pour voir le rétro-planning.
      </div>
    );
  }

  const { allTasks, startDate, endDate, numWeeks } = planningData;

  // Generate header weeks dynamically based on the planning period
  const headerWeeks = Array.from({ length: numWeeks }, (_, i) => {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + i * 7); // Move to the start of each consecutive week
    const weekNum = getWeekNumber(weekStart);
    const year = weekStart.getFullYear();
    return `S${weekNum}-${year % 100}`; // Compact week display
  });

  const getTaskDisplay = (task: TenderPlanningItem) => {
    const paddingLeft = task.level * 4; // Tailwind's pl-4, pl-8, etc.
    const className = task.isParent
      ? 'font-bold text-[#002D62] text-base sticky left-0 bg-blue-50 z-10 py-1 px-2 border-r border-gray-200' // Dalkia Dark Blue for parents
      : `text-gray-700 font-medium text-sm`;
    return (
      <div className={className} style={{ minWidth: '160px', paddingLeft: `${paddingLeft * 4}px` }}>
        {task.name}
      </div>
    );
  };

  const isTaskActiveInWeek = (task: TenderPlanningItem, weekIndex: number) => {
    if (!task.startDate || !task.endDate) return false;

    const currentWeekStart = new Date(startDate);
    currentWeekStart.setDate(startDate.getDate() + weekIndex * 7);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6); // End of the week

    // Adjust weekStart/weekEnd to be start/end of day for accurate comparison
    currentWeekStart.setHours(0, 0, 0, 0);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);
    taskStart.setHours(0, 0, 0, 0);
    taskEnd.setHours(23, 59, 59, 999);

    // Check if task period overlaps with the current week
    return (taskStart <= currentWeekEnd && taskEnd >= currentWeekStart);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl flex-grow flex flex-col">
      <h2 className="text-4xl font-extrabold text-[#002D62] mb-6 text-center">
        Rétro-planning dynamique
      </h2>
      <p className="text-base text-gray-600 mb-6 text-center">
        Période du <span className="font-bold text-[#002D62]">{formatDateToYYYYMMDD(startDate)}</span> au <span className="font-bold text-[#002D62]">{formatDateToYYYYMMDD(endDate)}</span>
      </p>

      <div className="flex justify-end mb-6 space-x-4">
        <button
          onClick={() => setShowAddTaskModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300"
          aria-label="Ajouter une tâche manuelle"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Ajouter une tâche</span>
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className={`font-bold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300
            ${hasChanges ? 'bg-[#002D62] hover:bg-blue-900 text-white' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          aria-label="Enregistrer les modifications"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span>Enregistrer</span>
        </button>
        <button
          onClick={exportToPdf}
          className="bg-[#F06A00] hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg shadow-md flex items-center space-x-2 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-orange-300"
          aria-label="Exporter le rétro-planning en fichier PDF"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Exporter en PDF</span>
        </button>
      </div>

      <div ref={retroPlanningTableRef} className="overflow-x-auto relative rounded-lg border border-gray-200 shadow-sm flex-grow">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-20">
            <tr>
              <th scope="col" className="px-2 py-1 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100 z-20 border-r border-gray-200" style={{ minWidth: '160px' }}>
                Tâche
              </th>
              <th scope="col" className="px-2 py-1 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-[160px] bg-gray-100 z-20 border-r border-gray-200" style={{ minWidth: '90px' }}>
                Responsable
              </th>
              <th scope="col" className="px-2 py-1 text-left text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-[250px] bg-gray-100 z-20 border-r border-gray-200" style={{ minWidth: '140px' }}>
                Commentaires
              </th>
              <th scope="col" className="px-1 py-1 text-center text-xs font-bold text-gray-700 uppercase tracking-wider sticky left-[390px] bg-gray-100 z-20 border-r border-gray-200" style={{ minWidth: '70px' }}>
                Durée (j)
              </th>
              <th scope="col" className="px-2 py-1 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100" style={{ minWidth: '80px' }}>
                Date Début
              </th>
              <th scope="col" className="px-2 py-1 text-center text-xs font-bold text-gray-700 uppercase tracking-wider bg-gray-100" style={{ minWidth: '80px' }}>
                Date Fin
              </th>
              {headerWeeks.map((week, index) => (
                <th key={index} scope="col" className={`px-1 py-1 text-center text-xs font-bold text-gray-700 uppercase tracking-wider min-w-[60px] bg-gray-100 ${index === headerWeeks.length - 1 ? 'rounded-tr-lg' : ''}`}>
                  {week}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {planningData.allTasks.map((task) => (
              <tr key={task.id} className={`${task.isParent ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'}`}>
                <td className="py-1 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-200">
                  {getTaskDisplay(task)}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-gray-700 sticky left-[160px] bg-white z-10 border-r border-gray-200" style={{ minWidth: '90px' }}>
                  <input
                    type="text"
                    className="p-1 border border-gray-300 bg-white rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    value={editedTaskDetails[task.id]?.responsible || ''}
                    onChange={(e) => handleDetailChange(task.id, 'responsible', e.target.value)}
                    aria-label={`Responsable pour la tâche ${task.name}`}
                  />
                </td>
                <td className="px-2 py-1 text-gray-700 sticky left-[250px] bg-white z-10 border-r border-gray-200" style={{ minWidth: '140px' }}>
                  <textarea
                    className="p-1 border border-gray-300 bg-white rounded-md w-full text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 resize-y"
                    rows={1}
                    value={editedTaskDetails[task.id]?.comments || ''}
                    onChange={(e) => handleDetailChange(task.id, 'comments', e.target.value)}
                    aria-label={`Commentaires pour la tâche ${task.name}`}
                  />
                </td>
                <td className="px-1 py-1 text-center text-gray-700 sticky left-[390px] bg-white z-10 border-r border-gray-200" style={{ minWidth: '70px' }}>
                  {!task.isParent ? (
                    <div className="flex items-center justify-center space-x-1">
                      <button
                        onClick={() => handleDurationChange(task.id, task.estimatedDurationDays, -1)}
                        className="p-0.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 focus:outline-none focus:ring-1 focus:ring-red-400 text-xs font-bold"
                        aria-label={`Réduire la durée de ${task.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" /></svg>
                      </button>
                      <span className="font-semibold text-sm">{task.estimatedDurationDays}</span>
                      <button
                        onClick={() => handleDurationChange(task.id, task.estimatedDurationDays, 1)}
                        className="p-0.5 rounded-full bg-green-100 text-green-600 hover:bg-green-200 focus:outline-none focus:ring-1 focus:ring-green-400 text-xs font-bold"
                        aria-label={`Augmenter la durée de ${task.name}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      </button>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-gray-700 border-l border-r border-gray-100 text-sm">
                  {task.startDate ? formatDateToYYYYMMDD(task.startDate) : '-'}
                </td>
                <td className="px-2 py-1 whitespace-nowrap text-center text-gray-700 border-l border-r border-gray-100 text-sm">
                  {task.endDate ? formatDateToYYYYMMDD(task.endDate) : '-'}
                </td>
                {Array.from({ length: numWeeks }).map((_, weekIndex) => (
                  <td key={weekIndex} className="px-1 py-1 whitespace-nowrap text-center border-l border-r border-gray-100">
                    {isTaskActiveInWeek(task, weekIndex) && (
                      <div
                        className={`h-3 rounded-md shadow-sm flex items-center justify-center text-white text-xs font-bold
                          ${task.isParent ? 'bg-[#002D62]' : 'bg-[#F06A00]'}`}
                        title={`${task.name}: ${task.startDate ? formatDateToYYYYMMDD(task.startDate) : 'N/A'} - ${task.endDate ? formatDateToYYYYMMDD(task.endDate) : 'N/A'}`}
                      >
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddTaskModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold text-[#002D62] mb-6">Ajouter une nouvelle tâche manuelle</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="newTaskName" className="block text-sm font-medium text-gray-700">Nom de la tâche</label>
                <input
                  type="text"
                  id="newTaskName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#F06A00] focus:border-[#F06A00]"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="newTaskDuration" className="block text-sm font-medium text-gray-700">Durée estimée (jours)</label>
                <input
                  type="number"
                  id="newTaskDuration"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#F06A00] focus:border-[#F06A00]"
                  value={newTaskDuration}
                  onChange={(e) => setNewTaskDuration(parseInt(e.target.value) || 1)}
                  min="1"
                  required
                />
              </div>
              <div>
                <label htmlFor="newTaskSection" className="block text-sm font-medium text-gray-700">Section</label>
                <select
                  id="newTaskSection"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#F06A00] focus:border-[#F06A00]"
                  value={newTaskSectionId}
                  onChange={(e) => setNewTaskSectionId(e.target.value)}
                  required
                >
                  {TASK_SECTIONS.map(section => (
                    <option key={section.id} value={section.id}>{section.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="newTaskResponsible" className="block text-sm font-medium text-gray-700">Responsable (optionnel)</label>
                <input
                  type="text"
                  id="newTaskResponsible"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#F06A00] focus:border-[#F06A00]"
                  value={newTaskResponsible}
                  onChange={(e) => setNewTaskResponsible(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="newTaskComments" className="block text-sm font-medium text-gray-700">Commentaires (optionnel)</label>
                <textarea
                  id="newTaskComments"
                  rows={2}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#F06A00] focus:border-[#F06A00] resize-y"
                  value={newTaskComments}
                  onChange={(e) => setNewTaskComments(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Annuler
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-[#002D62] text-white rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Ajouter la tâche
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RetroPlanning;