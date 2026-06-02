import { apiService } from "./service.js";

export class EmployeeTable {
    // 1.set your initialStates
    #currentPage = 1;
    #limit = 5;

    #employees = [];
    #pagination = {};

    constructor({
        tableBody,
        paginationContainer
    }) {
        // 2. Get the required data's Via API(internal i.e JS)
        this.tableBody = document.querySelector(tableBody);
        this.paginationContainer = document.querySelector(paginationContainer);
    }

    async init() {
        await this.loadEmployees();
        this.renderTable();
        this.renderPagination();
    }

    async loadEmployees() {
        // 2. Get the required data's Via API(external) and store it in our states
        const response = await apiService.get(`/protected/employees-show.php?page=${this.#currentPage}&limit=${this.#limit}`)
        this.#employees = response.data;
        this.#pagination = response.pagination;
        // console.log(this.#employees);
        // console.log(this.#pagination);
    }

    renderTable() {
        // 3. Render the data
        // console.log(this.#employees);
        this.tableBody.innerHTML = "";
        this.#employees.forEach(employee => {
            this.tableBody.insertAdjacentHTML(
                "beforeend",
                `
            <tr>
            <td>${employee.id}</td>
            <td>${employee.employee_id}</td>
            <td>${employee.name}</td>
            <td>${employee.department}</td>
            </tr>
            `
            )
        })
    }

    renderPagination() {
        // console.log(this.#pagination);
        this.paginationContainer.innerHTML = "";
        for (let i = 1; i <= this.#pagination.totalPages; i++) {
            this.paginationContainer.insertAdjacentHTML(
                "beforeend",
                `<button>${i}</button>`
            )
        }
    }
}