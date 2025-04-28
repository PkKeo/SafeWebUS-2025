async function fetchAndRenderChart() {
    chrome.storage.local.get("user", async (result) => {
        const userId = result.user.id;
        console.log("userId = %s", userId);
        try {
            
            await renderAbortPerWeb(userId);
            await renderAbortPerTag(userId);
            await renderAbortPerHour(userId);
            

        } catch (error) {
            console.error('Error fetching abort history:', error);
        }
    });
}

document.addEventListener('DOMContentLoaded', fetchAndRenderChart);


async function renderAbortPerWeb(userId) {
  try {
      const response = await fetch("http://127.0.0.1:8000/abort_count_by_web", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ id: userId })
      });

      if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
      }

      const abortCounts = await response.json();

      if (!abortCounts || abortCounts.error) {
          throw new Error(abortCounts?.error || "No data received from server.");
      }

      if (abortCounts.length === 0) {
          console.warn("No abort records found for this user.");
          return;
      }

      const labels = abortCounts.map(entry => entry.WebUrl);
      const data = abortCounts.map(entry => entry.AbortCount);

      const ctx = document.getElementById('WebChart').getContext('2d');
      new Chart(ctx, {
          type: 'bar',
          data: {
              labels: labels,
              datasets: [{
                  label: 'Abort Counts',
                  data: data,
                  backgroundColor: 'rgba(75, 192, 192, 0.5)',
                  borderColor: 'rgba(75, 192, 192, 1)',
                  borderWidth: 1
              }]
          },
          options: {
              responsive: false,
              scales: {
                  y: {
                      beginAtZero: true
                  }
              }
          }
      });

  } catch (error) {
      console.error('Error in renderAbortPerWeb:', error.message);
  }
}

async function renderAbortPerTag(userId)
{
  const response = await fetch("http://127.0.0.1:8000/abort_count_by_tag", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        id: userId  // Sending user ID inside POST body
    })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }

  const abortCounts = await response.json();

  if (!abortCounts || abortCounts.error) {
      throw new Error(abortCounts?.error || "No data received from server.");
  }

  if (abortCounts.length === 0) {
      console.warn("No abort records found for this user.");
      return;
  }

  const labels = abortCounts.map(entry => entry.Reason);
  const data = abortCounts.map(entry => entry.AbortCount);

  const ctx = document.getElementById('TagChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
              label: 'Abort Counts',
              data: data,
              backgroundColor: 'rgba(255, 99, 132, 0.2)',  // light red background
              borderColor: 'rgba(255, 99, 132, 1)',      // darker red border
              borderWidth: 1
          }]
      },
      options: {
          scales: {
              y: {
                  beginAtZero: true
              }
          }
      }
  });
}

async function renderAbortPerHour(userId) {
  try {
      // 1. Fetch counts by hour from server
      const res = await fetch("http://127.0.0.1:8000/abort_count_by_hour", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userId })
      });
      if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
      }

      // 2. Parse JSON safely
      let hourlyData;
      try {
          hourlyData = await res.json();
      } catch (e) {
          throw new Error("Failed to parse server JSON response");
      }

      if (!hourlyData || typeof hourlyData !== "object") {
          throw new Error("Invalid data received from server");
      }

      // 3. Get current hour
      const now = new Date();
      const currentHour = now.getHours(); // 0 to 23

      // 4. Build labels and counts array for last 24 hours relative to now
      const labels = [];
      const counts = [];

      for (let i = 23; i >= 0; i--) {
          const hour = (currentHour - i + 24) % 24; // ensure positive
          labels.push(`${hour}h`);
          counts.push(hourlyData[hour] || 0);
      }

      // 5. Get your canvas context
      const canvas = document.getElementById('HourChart');
      if (!canvas) {
          console.error('Canvas element with id="HourChart" not found.');
          return;
      }

      const ctx2 = canvas.getContext('2d');

      // 6. Render the Chart.js line chart
      new Chart(ctx2, {
          type: 'line',
          data: {
              labels: labels,
              datasets: [{
                  label: 'Abort count per hour (last 24h)',
                  data: counts,
                  backgroundColor: 'rgba(55, 123, 61, 0.2)',  // light green background
                  borderColor: 'rgb(23, 209, 45)',      // darker green border
                  fill: true,
                  tension: 0.4
              }]
          },
          options: {
              responsive: false,
              scales: {
                  y: { beginAtZero: true }
              }
          }
      });

  } catch (err) {
      console.error("Error rendering abort-per-hour chart:", err);
      // Optional: Show a message to user
  }
}
