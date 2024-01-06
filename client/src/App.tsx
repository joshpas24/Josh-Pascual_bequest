import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";

function App() {
  const [data, setData] = useState<string>();
  const [verify, setVerify] = useState<boolean>();
  const [showMessage, setShowMessage] = useState<boolean>(false)

  useEffect(() => {
    getData();
  }, []);

  const getData = async () => {
    const response = await fetch(API_URL);
    const { data } = await response.json();
    console.log('Response: ', response)
    const token = data.token
    console.log("Token received: ", token)
    setData(data);
  };

  const updateData = async () => {
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ data }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    await getData();
  };

  const verifyData = async () => {
    setShowMessage(true)
    const url = API_URL + '/verify'
    const verifiedData = await fetch(url, {
      method: 'GET',
      credentials: 'include'
    })
    const { verified } = await verifiedData.json()
    setVerify(verified)
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "absolute",
        padding: 0,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "20px",
        fontSize: "30px",
      }}
    >
      <div>Saved Data</div>
      <input
        style={{ fontSize: "30px" }}
        type="text"
        value={data}
        onChange={(e) => setData(e.target.value)}
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <button style={{ fontSize: "20px" }} onClick={updateData}>
          Update Data
        </button>
        <button style={{ fontSize: "20px" }} onClick={verifyData}>
          Verify Data
        </button>
      </div>

      {showMessage ?
      <div style={{ fontSize: "10pt" }}>
        {verify ? "Your data is secured" : "Your data has been tampered"}
      </div>
      : null
      }
    </div>
  );
}

export default App;
