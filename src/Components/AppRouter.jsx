import React, { lazy, Suspense } from "react";
import { useAppStore } from "../store/useAppStore.js";
import SuspenseLoader from "./ui/SuspenseLoader.jsx";

const Inscripciones = lazy(() => import("./Inscripciones.jsx"));
const CambiosEstadoBemo = lazy(() => import("./CambioEstados.jsx"));
const AuditarEstadisticas = lazy(() => import("./AuditarEstadisticas.jsx"));
const Informacion = lazy(() => import("./Informacion.jsx"));
const BuscarIdInc = lazy(() => import("./BuscarIdInc.jsx"));
const ProgramasPorEstudiante = lazy(() => import("./ProgramasPorEstudiante.jsx"));

// Para componentes exportados de forma nombrada:
const UndoPublicationPage = lazy(() => import("./HerramientasAcademicos.jsx").then(module => ({ default: module.UndoPublicationPage })));
const FinalUserPage = lazy(() => import("./HerramientasAcademicos.jsx").then(module => ({ default: module.FinalUserPage })));
const ExtractGroupsPage = lazy(() => import("./HerramientasAcademicos.jsx").then(module => ({ default: module.ExtractGroupsPage })));

/**
 * AppRouter
 * Maps the activeComponent ID to its corresponding lazy-loaded page component.
 */
export default function AppRouter() {
  const activeComponent = useAppStore(state => state.activeComponent);
  
  const renderComponent = () => {
    switch (activeComponent) {
      case "inscripciones-estudiante":
        return <Inscripciones key="inscripciones-estudiante" formType="estudiante" />;
      case "inscripciones-grupo":
        return <Inscripciones key="inscripciones-grupo" formType="grupo" />;
      case "inscripciones-multi":
        return <Inscripciones key="inscripciones-multi" formType="multi" />;
      case "inscripciones-especificos":
        return <Inscripciones key="inscripciones-especificos" formType="especificos" />;
      case "cambios-estado":
        return <CambiosEstadoBemo key="cambios-estado" />;
      case "auditar-estadisticas":
        return <AuditarEstadisticas key="auditar-estadisticas" />;
      case "informacion":
        return <Informacion key="informacion" />;
      case "buscar-id":
        return <BuscarIdInc key="buscar-id" />;
      case "programas-estudiante":
        return <ProgramasPorEstudiante key="programas-estudiante" />;
      case "herramientas-undo":
        return <UndoPublicationPage key="herramientas-undo" />;
      case "herramientas-final":
        return <FinalUserPage key="herramientas-final" />;
      case "herramientas-extraer":
        return <ExtractGroupsPage key="herramientas-extraer" />;
      default:
        return <Inscripciones key="default" formType="estudiante" />;
    }
  };

  return (
    <Suspense fallback={<SuspenseLoader />}>
      {renderComponent()}
    </Suspense>
  );
}
