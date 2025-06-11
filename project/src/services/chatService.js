export const sendMessageToAPI = async (message, conversationId) => {

  const response = await fetch("http://127.0.0.1:5001/query", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      conversationId
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("API Error:", errorText);
    throw new Error("Flask API Error: " + errorText);
  }

  const data = await response.json();
  return data.response;
};
