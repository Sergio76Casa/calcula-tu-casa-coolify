async function checkInforme() {
  console.log("Checking https://calculatucasa.com/informe ...");
  try {
    const res = await fetch("https://calculatucasa.com/informe");
    console.log(`Status: ${res.status} (${res.statusText})`);
    const text = await res.text();
    console.log("Response starts with:", text.substring(0, 150));
  } catch (err) {
    console.error("Error during check:", err);
  }
}

checkInforme();
