import React, { useState, useCallback, memo } from "react";

const CommandSender = memo(({ commands }) => {
  const [isLoading, setIsLoading] = useState(false);

  const sendCommands = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        "https://danilett0.app.n8n.cloud/webhook/93e39801-5d8a-4c2b-84af-81f837088ea4",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commands),
        }
      );

      if (!response.ok) {
        throw new Error("Error al enviar los comandos");
      }

      const data = await response.json();
      alert("Comandos enviados exitosamente");
      return data;
    } catch (error) {
      console.error("Error:", error);
      alert("Error al enviar los comandos: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [commands, isLoading]);

  return (
    <div
      className="command-sender"
      style={{ display: "flex", justifyContent: "flex-end" }}
    >
      {commands && commands.length > 0 && (
        <button
          className="btn btn-success"
          onClick={sendCommands}
          disabled={isLoading}
          style={{
            marginTop: "10px",
            position: "relative",
            minWidth: "150px",
          }}
        >
          {isLoading ? (
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            ></span>
          ) : null}
          {isLoading ? "Enviando..." : "Enviar comandos a Bemo"}
        </button>
      )}
    </div>
  );
});

CommandSender.displayName = "CommandSender";

export default CommandSender;
