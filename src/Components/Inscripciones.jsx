import React from 'react';
import FormEstudiante from './Inscripciones/FormEstudiante';
import FormGrupo from './Inscripciones/FormGrupo';
import FormCargaMasiva from './Inscripciones/FormCargaMasiva';
import FormCargaCombinada from './Inscripciones/FormCargaCombinada';

export default function Inscripciones({ formType }) {
  const renderForm = () => {
    switch (formType) {
      case 'estudiante':
        return <FormEstudiante />;
      case 'grupo':
        return <FormGrupo />;
      case 'multi':
        return <FormCargaMasiva />;
      case 'especificos':
        return <FormCargaCombinada />;
      default:
        return <FormEstudiante />;
    }
  };

  const getTitle = () => {
    switch (formType) {
      case 'estudiante':
        return 'Inscribir a Estudiante en Grupos';
      case 'grupo':
        return 'Inscribir Estudiantes a Grupo';
      case 'multi':
        return 'Carga Masiva (Estudiantes a sus respectivos Grupos)';
      case 'especificos':
        return 'Carga Combinada (Todos los Estudiantes a todos los Grupos)';
      default:
        return 'Inscripciones';
    }
  };

  return (
    <div className="content-container animate-slide-down" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <h2 className="inscripciones-title" style={{ textAlign: 'left', margin: 0, paddingBottom: '16px' }}>
        {getTitle()}
      </h2>
      <hr className="inscripciones-divider" style={{ width: '100%', margin: '0 0 24px 0' }} />
      {renderForm()}
    </div>
  );
}
