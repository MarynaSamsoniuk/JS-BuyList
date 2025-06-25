document.addEventListener("DOMContentLoaded", function () {
  fetch("tasks.json")
    .then((response) => {
      if (!response.ok) throw new Error("Data loading error");
      return response.json();
    })
    .then((tasks) => {
      if (!tasks || tasks.length === 0)
        throw new Error("No data for analytics");

      const formattedData = tasks.map((task) => {
        const dateObj = new Date(task.date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        return {
          Task: task.title,
          Date: formattedDate,
          Priority: task.priority,
          Status: task.done ? "Done" : "Not done",
        };
      });

      new WebDataRocks({
        container: "#wdr-component",
        toolbar: true,
        report: {
          dataSource: {
            data: formattedData,
            mapping: {
              Date: {
                type: "date",
              },
            },
          },
          options: {
            grid: {
              type: "flat" 
            }
          }
        },
      });
    })
    .catch((error) => {
      console.error(error);
      document.getElementById("wdr-component").innerHTML = `
        <div class="error">
          <p>${error.message}</p>
          <p>Check the contents of the tasks.json file</p>
        </div>
      `;
    });
});
