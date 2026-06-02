import { EmployeeTable } from "./pagination.js";

const table = new EmployeeTable({
    tableBody: "#employeeTableBody",
    paginationContainer: "#paginationContainer"
})

table.init();
