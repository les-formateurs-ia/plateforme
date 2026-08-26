
import React, { useState, useCallback, useEffect } from 'react';
import { LaunchSummaryReport, RiskReport, ScoringCriteriaReport } from '../types';
import { generateLaunchSummary, generateRiskReport, generateScoringCriteriaReport } from '../services/geminiService';
import Spinner from './Spinner';
import Accordion from './Accordion';

interface DashboardProps {
  combinedPdfText: string | null;
  globalIsLoading: boolean; // From App.tsx, indicates if initial PDF processing is still ongoing
  
  // Props for report data
  launchSummary: LaunchSummaryReport | null;
  riskReport: RiskReport | null;
  scoringCriteriaReport: ScoringCriteriaReport | null;

  // Props for loading states
  isLoadingLaunchSummary: boolean;
  isLoadingRiskReport: boolean;
  isLoadingScoringCriteria: boolean;

  // Props for error states
  errorLaunchSummary: string | null;
  errorRiskReport: string | null;
  errorScoringCriteria: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({
  combinedPdfText,
  globalIsLoading,
  launchSummary,
  riskReport,
  scoringCriteriaReport,
  isLoadingLaunchSummary,
  isLoadingRiskReport,
  isLoadingScoringCriteria,
  errorLaunchSummary,
  errorRiskReport,
  errorScoringCriteria,
}) => {

  // No internal report generation or loading/error states needed anymore,
  // as they are managed by the parent App component and passed as props.

  if (!combinedPdfText && !globalIsLoading) {
    return (
      <div className="text-center p-8 text-2xl text-gray-500">
        Uploadez des fichiers PDF sur la page d'accueil pour générer les rapports du Dashboard.
      </div>
    );
  }

  const allReportsLoading = isLoadingLaunchSummary || isLoadingRiskReport || isLoadingScoringCriteria;

  if (globalIsLoading || allReportsLoading) { // Consolidated loading state
    return (
      <div className="text-center p-8 text-2xl text-[#002D62] font-semibold">
        Chargement des documents et préparation du Dashboard...
        <Spinner />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl h-full flex flex-col">
      <h2 className="text-4xl font-extrabold text-[#002D62] mb-8 text-center">
        Dashboard d'Analyse d'Appel d'Offre
      </h2>

      {/* No more specific "Generating reports..." message here, handled by global loading */}

      <div className="space-y-8 flex-grow">
        {/* Synthèse de Lancement Automatisée */}
        <Accordion title="1. Synthèse de Lancement Automatisée" defaultOpen>
          {errorLaunchSummary && (
            <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-800 rounded-md shadow-sm">
              {errorLaunchSummary}
            </div>
          )}
          {launchSummary ? (
            <div className="space-y-5 text-gray-800">
              <div>
                <h4 className="font-bold text-xl text-[#002D62] mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#002D62]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M10 12H7m-3 0h3m-3 4h3m-6-4h.01M10 16H7m-3 0h3" /></svg>
                  Objectifs de la Collectivité :
                </h4>
                <ul className="list-disc list-inside ml-6 space-y-1 text-lg text-gray-700">
                  {launchSummary.objectifsCollectivite.length > 0 ?
                    launchSummary.objectifsCollectivite.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    )) : <li className="italic text-gray-500">Aucun objectif trouvé.</li>
                  }
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xl text-[#002D62] mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#002D62]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.539 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.519-4.674a1 1 0 00-.364-1.118L2.98 9.09c-.783-.57-.381-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.519-4.674z" /></svg>
                  Critères de Notation Pondérés :
                </h4>
                <ul className="list-disc list-inside ml-6 space-y-1 text-lg text-gray-700">
                  {launchSummary.criteresNotationPonderes.length > 0 ?
                    launchSummary.criteresNotationPonderes.map((crit, i) => (
                      <li key={i}>{crit}</li>
                    )) : <li className="italic text-gray-500">Aucun critère de notation trouvé.</li>
                  }
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xl text-[#002D62] mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-[#002D62]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Contraintes de Tracé :
                </h4>
                <ul className="list-disc list-inside ml-6 space-y-1 text-lg text-gray-700">
                  {launchSummary.contraintesTrace.length > 0 ?
                    launchSummary.contraintesTrace.map((constr, i) => (
                      <li key={i}>{constr}</li>
                    )) : <li className="italic text-gray-500">Aucune contrainte de tracé trouvée.</li>
                  }
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500 text-lg">
              {"La synthèse de lancement sera générée automatiquement après le traitement des documents."}
            </div>
          )}
        </Accordion>

        {/* Gestion des Risques (Note de Couverture) */}
        <Accordion title="2. Gestion des Risques (Note de Couverture)" defaultOpen>
          {errorRiskReport && (
            <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-800 rounded-md shadow-sm">
              {errorRiskReport}
            </div>
          )}
          {riskReport ? (
            <div className="space-y-5 text-gray-800">
              <div>
                <h4 className="font-bold text-xl text-red-700 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Clauses à Pénalités :
                </h4>
                <ul className="list-disc list-inside ml-6 space-y-1 text-lg text-red-700">
                  {riskReport.clausesAPenalites.length > 0 ?
                    riskReport.clausesAPenalites.map((clause, i) => (
                      <li key={i}>{clause}</li>
                    )) : <li className="italic text-gray-500">Aucune clause à pénalités trouvée.</li>
                  }
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xl text-orange-700 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.001 12.001 0 002.928 12c.04 1.32.32 2.62.836 3.842l-.304.595a1 1 0 00.99 1.488h13.264a1 1 0 00.99-1.488l-.304-.595a12.001 12.001 0 00.836-3.842c-.04-.834-.14-.166-.14-.166z" /></svg>
                  Garanties de Performance :
                </h4>
                <ul className="list-disc list-inside ml-6 space-y-1 text-lg text-orange-700">
                  {riskReport.garantiesPerformance.length > 0 ?
                    riskReport.garantiesPerformance.map((garantie, i) => (
                      <li key={i}>{garantie}</li>
                    )) : <li className="italic text-gray-500">Aucune garantie de performance trouvée.</li>
                  }
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-xl text-purple-700 mb-2 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Autres Risques :
                </h4>
                <ul className="list-disc list-inside ml-6 space-y-1 text-lg text-purple-700">
                  {riskReport.autresRisques.length > 0 ?
                    riskReport.autresRisques.map((risk, i) => (
                      <li key={i}>{risk}</li>
                    )) : <li className="italic text-gray-500">Aucun autre risque trouvé.</li>
                  }
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500 text-lg">
              {"La note de couverture sera générée automatiquement après le traitement des documents."}
            </div>
          )}
        </Accordion>

        {/* Extracteur de Critères de Notation */}
        <Accordion title="3. Extracteur de critères de notation" defaultOpen>
          {errorScoringCriteria && (
            <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-800 rounded-md shadow-sm">
              {errorScoringCriteria}
            </div>
          )}
          {scoringCriteriaReport ? (
            <div className="space-y-6 text-gray-800">
              {scoringCriteriaReport.criteres.length === 0 ? (
                <p className="text-center p-4 text-gray-500 italic text-lg">Aucun critère de notation détaillé trouvé.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scoringCriteriaReport.criteres.map((item, i) => (
                    <div key={i} className="bg-gray-100 p-5 rounded-lg shadow-md border border-gray-200">
                      <h4 className="font-bold text-xl text-[#002D62] mb-3">{item.critere}</h4>
                      <p className="mb-3 text-lg"><span className="font-semibold text-gray-900">Besoin caché:</span> {item.besoinCache}</p>
                      <p className="text-lg"><span className="font-semibold text-gray-900">Killer Argument:</span> <span className="text-green-800 italic">{item.killerArgument}</span></p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center p-4 text-gray-500 text-lg">
              {"L'extraction des critères de notation sera générée automatiquement après le traitement des documents."}
            </div>
          )}
        </Accordion>
      </div>
    </div>
  );
};

export default Dashboard;