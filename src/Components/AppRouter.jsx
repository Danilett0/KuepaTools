import Inscripciones from "./Inscripciones.jsx";
import CambiosEstadoBemo from "./CambioEstados.jsx";
import AuditarEstadisticas from "./AuditarEstadisticas.jsx";
import Informacion from "./Informacion.jsx";
import BuscarIdInc from "./BuscarIdInc.jsx";
import ProgramasPorEstudiante from "./ProgramasPorEstudiante.jsx";
import { UndoPublicationPage, FinalUserPage, ExtractGroupsPage } from "./HerramientasAcademicos.jsx";

/**
 * AppRouter
 * Maps the activeComponent ID to its corresponding page component.
 *
 * @param {string} activeComponent - The currently active route ID
 */
export default function AppRouter({ activeComponent }) {
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
}
