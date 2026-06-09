import { EmployeeTable } from "./pagination.js";
import { Search } from "./search.js";

const table = new EmployeeTable({
    tableBody: "#employeeTableBody",
    paginationContainer: "#paginationContainer",
    summaryContainer: "#summaryContainer",
    pageSize: "#pageSize",
    pageSizeOptions: [5,10,15,20,25],
    departmentFilter: "#departmentFilter"
})

const search = new Search({
    input: "#search",
    delay: 300,
    onSearch: (value) => {
        table.handleSearch(value);
    }
})

table.init();
