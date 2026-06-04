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
        this.bindEvents();
        await this.loadEmployees();
        this.renderTable();
        this.renderPagination();
    }

    // 2. Get the required data's Via API(external) and store it in our states
    async loadEmployees() {
        const response = await apiService.get(`/protected/employees-show.php?page=${this.#currentPage}&limit=${this.#limit}`)
        this.#employees = response.data;
        this.#pagination = response.pagination;
        // console.log(this.#employees);
        // console.log(this.#pagination);
    }

    // 3. Render the data inside the table
    renderTable() {
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

    // 4. render the pagination below the table
    renderPagination() {
        // console.log(this.#pagination);
        this.paginationContainer.innerHTML = "";
        const isFirstPage = this.#currentPage === 1;
        const isLastPage = this.#currentPage === this.#pagination.totalPages;
        this.paginationContainer.insertAdjacentHTML("afterbegin",
            `<button class="pagination-prev" ${isFirstPage ? "disabled" : ""}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M164.24,203.76a6,6,0,1,1-8.48,8.48l-80-80a6,6,0,0,1,0-8.48l80-80a6,6,0,0,1,8.48,8.48L88.49,128Z"/></svg>
            </button>`
        )
        this.paginationContainer.insertAdjacentHTML("afterbegin",
            `<button class="pagination-first" ${isFirstPage ? "disabled" : ""}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M204.24,203.76a6,6,0,1,1-8.48,8.48l-80-80a6,6,0,0,1,0-8.48l80-80a6,6,0,0,1,8.48,8.48L128.49,128ZM48.49,128l75.75-75.76a6,6,0,0,0-8.48-8.48l-80,80a6,6,0,0,0,0,8.48l80,80a6,6,0,1,0,8.48-8.48Z"/></svg>
            </button>`
        )
        for (let i = 1; i <= this.#pagination.totalPages; i++) {
            const activeClass = i === this.#currentPage ? "active" : "";
            this.paginationContainer.insertAdjacentHTML(
                "beforeend",
                `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`
            )
        }
        this.paginationContainer.insertAdjacentHTML("beforeend",
            `<button class="pagination-next" ${isLastPage ? "disabled" : ""}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M180.24,132.24l-80,80a6,6,0,0,1-8.48-8.48L167.51,128,91.76,52.24a6,6,0,0,1,8.48-8.48l80,80A6,6,0,0,1,180.24,132.24Z"/></svg>
                </button>`
        )
        this.paginationContainer.insertAdjacentHTML("beforeend",
            ` <button class="pagination-last" ${isLastPage ? "disabled" : ""}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M140.24,132.24l-80,80a6,6,0,0,1-8.48-8.48L127.51,128,51.76,52.24a6,6,0,0,1,8.48-8.48l80,80A6,6,0,0,1,140.24,132.24Zm80-8.48-80-80a6,6,0,0,0-8.48,8.48L207.51,128l-75.75,75.76a6,6,0,1,0,8.48,8.48l80-80A6,6,0,0,0,220.24,123.76Z"/></svg>
            </button>`
        )
    }

    // 5 i) Navigate through pages using the currentPage what we get:
    async handlePageChange(page) {
        this.#currentPage = page;
        await this.loadEmployees();
        this.renderTable();
        this.renderPagination();
    }

    // 5 ii) just click the button get the dataset from the button and send it to the handlePage
    bindEvents() {
        this.paginationContainer.addEventListener("click", async (event) => {
            const button = event.target.closest(".page-btn");
            const firstButton = event.target.closest(".pagination-first");
            const prevButton = event.target.closest(".pagination-prev");
            const lastButton = event.target.closest(".pagination-last");
            const nextButton = event.target.closest(".pagination-next");
            if (
                nextButton &&
                this.#currentPage < this.#pagination.totalPages
            ) {
                await this.handlePageChange(
                    this.#currentPage + 1
                );

                return;
            }

            if (
                prevButton &&
                this.#currentPage > 1
            ) {
                await this.handlePageChange(
                    this.#currentPage - 1
                );

                return;
            }

            if(firstButton) {
                await this.handlePageChange(1);
                return;
            }

            if(lastButton) {
                await this.handlePageChange(this.#pagination.totalPages);
                return;
            }
            if (!button) return;
            const page = Number(button.dataset.page);
            await this.handlePageChange(page);
        })
    }
}
