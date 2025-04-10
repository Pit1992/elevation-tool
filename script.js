let xmlDoc = null;
let pointIdCounter = 1;
let decimalPlaces = 4;

function loadXML(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const parser = new DOMParser();
    xmlDoc = parser.parseFromString(e.target.result, "text/xml");
    alert("XML 載入成功！");
  };
  reader.readAsText(file);
}

function findElevation() {
  if (!xmlDoc) {
    alert("請先上傳 XML 檔案！");
    return;
  }

  const e = parseFloat(document.getElementById("easting").value);
  const n = parseFloat(document.getElementById("northing").value);
  decimalPlaces = parseInt(document.getElementById("decimalSelect").value);
  if (isNaN(e) || isNaN(n)) {
    alert("請輸入正確的 E、N 坐標！");
    return;
  }

  const points = Array.from(xmlDoc.getElementsByTagName("P")).map(p => {
    const [y, x, z] = p.textContent.trim().split(" ").map(parseFloat);
    return { id: p.getAttribute("id"), x, y, z };
  });

  const triangles = Array.from(xmlDoc.getElementsByTagName("F")).map(f => {
    const [a, b, c] = f.textContent.trim().split(" ").map(Number);
    return [points[a - 1], points[b - 1], points[c - 1]];
  });

  for (const tri of triangles) {
    const z = interpolateZ(tri, e, n);
    if (z !== null) {
      addToHistory(e, n, z);
      return;
    }
  }

  alert("查詢點不在地形範圍內。");
}

function interpolateZ([p1, p2, p3], x, y) {
  const detT =
    (p2.y - p3.y) * (p1.x - p3.x) +
    (p3.x - p2.x) * (p1.y - p3.y);
  const a = ((p2.y - p3.y) * (x - p3.x) + (p3.x - p2.x) * (y - p3.y)) / detT;
  const b = ((p3.y - p1.y) * (x - p3.x) + (p1.x - p3.x) * (y - p3.y)) / detT;
  const c = 1 - a - b;

  if (a >= 0 && b >= 0 && c >= 0) {
    return a * p1.z + b * p2.z + c * p3.z;
  }
  return null;
}

function addToHistory(e, n, z) {
  const table = document.getElementById("history-table");
  const row = table.insertRow();
  const id = pointIdCounter++;

  row.insertCell().textContent = id;
  row.insertCell().textContent = e.toFixed(decimalPlaces);
  row.insertCell().textContent = n.toFixed(decimalPlaces);
  row.insertCell().textContent = z.toFixed(decimalPlaces);

  const record = {
    id,
    e: e.toFixed(decimalPlaces),
    n: n.toFixed(decimalPlaces),
    z: z.toFixed(decimalPlaces)
  };

  const history = JSON.parse(localStorage.getItem("queryHistory")) || [];
  history.push(record);
  localStorage.setItem("queryHistory", JSON.stringify(history));
}

function loadQueryHistory() {
  const history = JSON.parse(localStorage.getItem("queryHistory")) || [];
  const table = document.getElementById("history-table");
  while (table.rows.length > 1) table.deleteRow(1);

  history.forEach(item => {
    const row = table.insertRow();
    row.insertCell().textContent = item.id;
    row.insertCell().textContent = item.e;
    row.insertCell().textContent = item.n;
    row.insertCell().textContent = item.z;
  });

  if (history.length > 0) {
    pointIdCounter = history[history.length - 1].id + 1;
  }
}

function clearHistory() {
  localStorage.removeItem("queryHistory");
  const table = document.getElementById("history-table");
  while (table.rows.length > 1) table.deleteRow(1);
  pointIdCounter = 1;
}

document.addEventListener("DOMContentLoaded", loadQueryHistory);
