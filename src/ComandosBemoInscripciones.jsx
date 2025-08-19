import React, { useState } from 'react';

function ComandosBemoInscripciones() {
  const [groupId, setGroupId] = useState('');
  const [studentIds, setStudentIds] = useState(Array(10).fill(''));
  const [generatedCommand, setGeneratedCommand] = useState('');

  const handleStudentIdChange = (index, value) => {
    const updatedStudentIds = [...studentIds];
    updatedStudentIds[index] = value;
    setStudentIds(updatedStudentIds);
  };

  const handleEnroll = () => {
    const filteredStudentIds = studentIds.filter((id) => id.trim() !== '');
    const command = `bemo run:prod enroll:user["${groupId}","${filteredStudentIds.join('","')}"]`;
    setGeneratedCommand(command);
  };

  const handleRemove = () => {
    const filteredStudentIds = studentIds.filter((id) => id.trim() !== '');
    const command = `bemo run:prod pull:user:from:group["${groupId}","${filteredStudentIds.join('","')}"]`;
    setGeneratedCommand(command);
  };

  const handleClear = () => {
    setGroupId('');
    setStudentIds(Array(9).fill(''));
    setGeneratedCommand('');
  };

  const handleRemoveOne = () => {
    const filteredStudentIds = studentIds.filter((id) => id.trim() !== '');
    if (filteredStudentIds.length > 0) {
      const commands = filteredStudentIds.map((studentId) => {
        return `bemo run:prod pull:user:from:group["${groupId}","${studentId}"]`;
      });
      setGeneratedCommand(commands.join('\n'));
    } else {
      setGeneratedCommand('');
    }
  };

  return (
    <div style={{
      backgroundColor: '#042344',
      minHeight: '100vh',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
    
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{textAlign:"center"}}>Listado de estudiantes vs grupo para inscribir o eliminar</h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '20px'
        }}>
          <input
            type="text"
            id="groupId"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
          <hr style={{
            margin: '20px 0',
            border: 'none',
            borderTop: '1px solid #ccc'
          }} />
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
          }}>
            {studentIds.map((studentId, index) => (
              <input
                key={index}
                type="text"
                id={`studentId-${index}`}
                value={studentId}
                onChange={(e) => handleStudentIdChange(index, e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            ))}
          </div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginTop: '20px'
        }}>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#007bff',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#0056b3')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#007bff')}
            onClick={handleEnroll}
          >
            Inscribir estudiantes en grupo
          </button>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#dc3545',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#a71d2a')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#dc3545')}
            onClick={handleRemove}
          >
            Eliminar estudiantes de grupo
          </button>
          <button
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              backgroundColor: '#28a745',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#218838')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#28a745')}
            onClick={handleRemoveOne}
          >
            Sacar estudiante de grupos
          </button>
          <button
            style={{
              padding: '10px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#ffc107',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '40px',
              height: '40px'
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#e0a800')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#ffc107')}
            onClick={handleClear}
          >
            🧹
          </button>
        </div>
        {generatedCommand && (
          <div style={{
            marginTop: '20px',
            padding: '10px',
            borderRadius: '5px',
            backgroundColor: '#f8f9fa',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            color: '#333',
            wordBreak: 'break-word'
          }}>
            <strong>Comando generado:</strong>
            <p style={{ margin: '10px 0', whiteSpace: 'pre-line' }}>{generatedCommand}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComandosBemoInscripciones;
