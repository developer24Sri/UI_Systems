import { apiService } from "./service.js";

export class EmployeeTable {
    // 1.set your initialStates
    #currentPage = 1;
    #limit = 5;
    #user = "";
    #searchTerm = "";
    #selectedDepartment = "";
    #sortBy = "";
    #sortOrder = "ASC";
    #employees = [];
    #departments = [];
    #pagination = {};
    #isLoading = false;
    #isError = false;
    #error = null;

    constructor({
        tableBody,
        paginationContainer,
        summaryContainer,
        pageSize,
        pageSizeOptions,
        departmentFilter,
        tableHead,
    }) {
        // 2. Get the required data's Via API(internal i.e JS)
        this.tableBody = document.querySelector(tableBody);
        this.paginationContainer = document.querySelector(paginationContainer);
        this.summaryContainer = document.querySelector(summaryContainer);
        this.pageSize = document.querySelector(pageSize);
        this.pageSizeOptions = pageSizeOptions;
        this.departmentFilter = document.querySelector(departmentFilter);
        this.tableHead = document.querySelector(tableHead);
    }

    // HELPERS METHODS:
    async loadCurrentUser() {
        const response = await apiService.get(
            "/protected/profile.php"
        );
        this.#user = response.data;
    }

    isAdmin() {
        return this.#user?.role === "admin";
    }

    updateTableColumns() {
        const actionColumn =
            document.querySelector("#actionColumn");

        if (this.#user.role !== "admin") {
            actionColumn.style.display = "none";
        }
    }

    /*================================================================================================================================================================================================================================*/

    // 0. i) loads all the inital render's and data's related to it.
    async init() {
        this.bindEvents();
        await this.loadCurrentUser();
        this.updateTableColumns();
        await this.loadDepartments();
        this.refreshUI();
        this.renderPageSizeSelector();
        this.renderDepartmentFilter();
    }

    // 0. ii) A common method which almost requires where-ever the UI been updated:
    async refreshUI() {
        this.#isLoading = true;
        this.renderTable();
        this.renderPagination();
        this.renderSummary();
        await this.loadEmployees();
        this.#isLoading = false;
        this.renderTable();
        this.renderPagination();
        this.renderSummary();
    }

    // 2. Get the required data's Via API(external) and store it in our states
    async loadEmployees() {
        try {
            this.#isError = false;
            this.#error = null;
            const response = await apiService.get(
                `/protected/employees-show.php?page=${this.#currentPage}&limit=${this.#limit}&search=${encodeURIComponent(this.#searchTerm)}&department=${encodeURIComponent(this.#selectedDepartment)}&sortBy=${this.#sortBy}&sortOrder=${this.#sortOrder}`)
            this.#employees = response.data;
            this.#pagination = response.pagination;
        } catch (error) {
            this.#isError = true;
            this.#error = error?.message;
        }
    }

    // 9. load departments to get the departments name:
    async loadDepartments() {
        const response = await apiService.get("/protected/get-department.php")
        this.#departments = response.data;
        // console.log(this.#departments);
    }

    // 3. Render the data inside the table
    renderTable() {
        this.tableBody.innerHTML = "";
        // fallback if there is no employee data
        if (this.#isLoading) {
            this.tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Loading Employees...
                </td>
            </tr>
            `;
            return;
        } else if (this.#isError) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        Error: ${this.#error}
                    </td>
                </tr>
            `;
            return;
        } else if (this.#employees.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No Employees found!
                    </td>
                </tr>
                `;
            return;
        } else {
            this.#employees.forEach(employee => {
                this.tableBody.insertAdjacentHTML(
                    "beforeend",
                    `
                        <tr>
                        <td>${employee.id}</td>
                        <td>${employee.employee_id}</td>
                        <td>${employee.name}</td>
                        <td>${employee.department}</td>
                        ${this.#user.role === "admin"
                        ?
                        `
                            <td>
                                 <button class="delete-btn" data-id="${employee.id}">Delete</button>
                            </td>
                            `
                        :
                        ""
                    }
                        </tr>
                        `
                )
            })
        }
    }

    // 10. smart pagination for admin dashboards:
    getVisiblePages() {
        const pages = [];
        const totalPages = this.#pagination.totalPages;

        pages.push(1);

        if (this.#currentPage > 3) {
            pages.push("...");
        }

        for (let i = this.#currentPage - 1; i <= this.#currentPage + 1; i++) {
            if (i > 1 && i < totalPages) {
                pages.push(i);
            }
        }

        if (this.#currentPage < totalPages - 2) {
            pages.push("...");
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return [...new Set(pages)];
    }

    // 4. render the pagination below the table
    renderPagination() {
        this.paginationContainer.innerHTML = "";
        const isFirstPage = this.#currentPage === 1;
        const isLastPage = this.#currentPage === this.#pagination.totalPages;
        this.paginationContainer.insertAdjacentHTML(
            "afterbegin",
            `<button class="pagination-prev" ${isFirstPage ? "disabled" : ""}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M164.24,203.76a6,6,0,1,1-8.48,8.48l-80-80a6,6,0,0,1,0-8.48l80-80a6,6,0,0,1,8.48,8.48L88.49,128Z"/></svg>
            </button>`
        )
        this.paginationContainer.insertAdjacentHTML(
            "afterbegin",
            `<button class="pagination-first" ${isFirstPage ? "disabled" : ""}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M204.24,203.76a6,6,0,1,1-8.48,8.48l-80-80a6,6,0,0,1,0-8.48l80-80a6,6,0,0,1,8.48,8.48L128.49,128ZM48.49,128l75.75-75.76a6,6,0,0,0-8.48-8.48l-80,80a6,6,0,0,0,0,8.48l80,80a6,6,0,1,0,8.48-8.48Z"/></svg>
            </button>`
        )
        // for (let i = 1; i <= this.#pagination.totalPages; i++) {
        //     const activeClass = i === this.#currentPage ? "active" : "";
        //     this.paginationContainer.insertAdjacentHTML(
        //         "beforeend",
        //         `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`
        //     )
        // }
        const visiblePages = this.getVisiblePages();
        visiblePages.forEach(page => {
            if (page === "...") {
                this.paginationContainer.insertAdjacentHTML(
                    "beforeend",
                    `<span>...</span>`
                );
                return;
            }

            const activeClass = page === this.#currentPage ? "active" : "";
            console.log(page, this.#currentPage);
            this.paginationContainer.insertAdjacentHTML(
                "beforeend",
                `
                <button class="page-btn ${activeClass}" data-page="${page}">
                    ${page} 
                </button>
                `
            )
        })

        this.paginationContainer.insertAdjacentHTML(
            "beforeend",
            `<button class="pagination-next" ${isLastPage ? "disabled" : ""}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M180.24,132.24l-80,80a6,6,0,0,1-8.48-8.48L167.51,128,91.76,52.24a6,6,0,0,1,8.48-8.48l80,80A6,6,0,0,1,180.24,132.24Z"/></svg>
                </button>`
        )
        this.paginationContainer.insertAdjacentHTML(
            "beforeend",
            ` <button class="pagination-last" ${isLastPage ? "disabled" : ""}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#000000" viewBox="0 0 256 256"><path d="M140.24,132.24l-80,80a6,6,0,0,1-8.48-8.48L127.51,128,51.76,52.24a6,6,0,0,1,8.48-8.48l80,80A6,6,0,0,1,140.24,132.24Zm80-8.48-80-80a6,6,0,0,0-8.48,8.48L207.51,128l-75.75,75.76a6,6,0,1,0,8.48,8.48l80-80A6,6,0,0,0,220.24,123.76Z"/></svg>
            </button>`
        )
    }

    // 6. to render the record summary of the employees:
    renderSummary() {
        if (this.#employees.length === 0) {
            this.summaryContainer.textContent = `No Records found!`
            return;
        }
        const startText = ((this.#currentPage - 1) * this.#limit) + 1;
        const endText = Math.min(this.#currentPage * this.#limit, this.#pagination.totalRecords);
        this.summaryContainer.textContent = `Showing ${startText} to ${endText} rows from ${this.#pagination.totalRecords} records.`
    }

    // 7. i) to render the page size select element:
    renderPageSizeSelector() {
        this.pageSize.innerHTML = "";
        this.pageSizeOptions.forEach(size => {
            this.pageSize.insertAdjacentHTML(
                "beforeend",
                `
                 <option value="${size}">
                    ${size}
                </option>
                `
            );
        })
        this.pageSize.value = this.#limit;
    }

    // 7. ii) to handle the entire component when changes made based on page limit:
    async handlePageSizeChange(limit) {
        this.#limit = limit;
        this.#currentPage = 1;
        await this.refreshUI();
    }

    // 8. to handle the entire component when changes made based on user search:
    async handleSearch(searchTerm) {
        this.#searchTerm = searchTerm;
        this.#currentPage = 1;
        await this.refreshUI()
    }

    // 9. i) to render the deparments select element:
    renderDepartmentFilter() {
        this.departmentFilter.innerHTML =
            `<option value="">All</option>
        `
        this.#departments.forEach(department => {
            this.departmentFilter.insertAdjacentHTML(
                "beforeend",
                `
            <option value="${department}">
            ${department}
            </option>
            `
            )
        })
    }

    // 9. ii) to hande the entire component when changes made based on department filter:
    async handleDepartmentChange(department) {
        this.#selectedDepartment = department;
        this.#currentPage = 1;
        await this.refreshUI();
    }

    // 10 to render the table based on what sort the current state is on:
    async handleSort(column) {
        if (this.#sortBy === column) {
            this.#sortOrder = this.#sortOrder === "ASC" ? "DESC" : "ASC";
        } else {
            this.#sortBy = column;
            this.#sortOrder = "ASC";
        }
        this.#currentPage = 1;
        await this.refreshUI();
    }

    // CRUD operations:
    // DELETE:
    async handleDelete(employeeId) {
        // console.log(employeeId);
        const confirmed = confirm("Are you sure to delete this employee ?")
        if (!confirmed) return;
        try {
            await apiService.delete(`/protected/employee-delete.php?id=${employeeId}`);
            // to hadle the edge case of last record been deleted in the currentPage which should not show no employees found.
            if (
                this.#employees.length === 1 &&
                this.#currentPage > 1
            ) {
                this.#currentPage--;
            }
            await this.refreshUI();
        } catch (error) {
            alert(error.message);
        }
    }

    /*==============================================================================================================================================================================================================================================*/

    // 5 i) Navigate through pages using the currentPage what we get:
    async handlePageChange(page) {
        this.#currentPage = page;
        await this.refreshUI();
    }

    // 5 ii) just click the button get the dataset from the button and send it to the handlePage
    bindEvents() {
        this.paginationContainer.addEventListener("click", async (event) => {
            const button = event.target.closest(".page-btn");
            const firstButton = event.target.closest(".pagination-first");
            const prevButton = event.target.closest(".pagination-prev");
            const lastButton = event.target.closest(".pagination-last");
            const nextButton = event.target.closest(".pagination-next");
            if (nextButton && this.#currentPage < this.#pagination.totalPages) {
                await this.handlePageChange(this.#currentPage + 1);
                return;
            }

            if (prevButton && this.#currentPage > 1) {
                await this.handlePageChange(this.#currentPage - 1);
                return;
            }

            if (firstButton && this.#currentPage !== 1) {
                await this.handlePageChange(1);
                return;
            }

            if (lastButton && this.#currentPage !== this.#pagination.totalPages) {
                await this.handlePageChange(this.#pagination.totalPages);
                return;
            }
            if (!button) return;
            const page = Number(button.dataset.page);
            await this.handlePageChange(page);
        })
        this.pageSize.addEventListener("change", async (event) => {
            const limit = Number(event.target.value);
            await this.handlePageSizeChange(limit);
        }
        )
        this.departmentFilter.addEventListener("change", async (event) => {
            await this.handleDepartmentChange(
                event.target.value
            )
        }
        )
        this.tableHead.addEventListener("click", async (event) => {
            const column = event.target.dataset.sort;
            if (!column) return;
            await this.handleSort(column);
        }
        )
        this.tableBody.addEventListener("click", async (event) => {
            const deleteButton = event.target.closest(".delete-btn");
            if (!deleteButton) return;
            const employeeId = deleteButton.dataset.id;
            await this.handleDelete(employeeId);
        })
    }
}

