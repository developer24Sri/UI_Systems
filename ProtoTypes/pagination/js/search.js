export class Search {
    constructor({
        input,
        onSearch,
        delay = 300
    }) {
        this.input = document.querySelector(input);
        this.onSearch = onSearch;
        this.delay = delay;
        this.bindEvents();
    }

    debounce(callback, delay) {
        let timeoutId;

        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                callback(...args);
            }, delay);
        };
    }

    bindEvents() {
        const debouncedSearch = this.debounce(
            this.onSearch,
            this.delay
        )

        this.input.addEventListener(
            "input",
            (event) => {
                debouncedSearch(event.target.value);
            }
        )
    }
}