import { EmployeeTable } from "./pagination.js";

const table = new EmployeeTable({
    tableBody: "#employeeTableBody",
    paginationContainer: "#paginationContainer",
    summaryContainer: "#summaryContainer",
    pageSize: "#pageSize",
    pageSizeOptions: [5,10,15,20,25]
})

table.init();
