/*jslint browser*/
const days = [
    {abbreviation: "Monday", name: "Mon"},
    {abbreviation: "Tuesday", name: "Tue"},
    {abbreviation: "Wednesday", name: "Wed"},
    {abbreviation: "Thursday", name: "Thu"},
    {abbreviation: "Friday", name: "Fri"},
    {abbreviation: "Saturday", name: "Sat"},
    {abbreviation: "Sunday", name: "Sun"}
];
const defaultActions = [
    "previous year",
    "previous month",
    "next month",
    "next year"
];
const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];
const dateAttributeMap = Object.freeze({
    "day-format": "day",
    "month-format": "month",
    "week-day-format": "weekday",
    "year-format": "year"
});
const attributeMap = Object.freeze({
    "ignore-on-focus": "ignoreOnFocus",
    "init-date": "initDate",
    "locale": "locale",
    "sunday-first": "sundayFirst",
    "switch-year": "yearSwitchable"
});
function dayNames(sundayFirst) {
    return (
        sundayFirst
        ? [days[6]].concat(days.slice(0, 6))
        : days
    );
}
function areSameDay(date1, date2) {
    if (date1 === undefined || date2 === undefined) {
        return false;
    }
    return (
        date1.getDate() === date2.getDate()
        && date1.getMonth() === date2.getMonth()
        && date1.getFullYear() === date2.getFullYear()
    );
}

function getInitialConfig() {
    return {
        dateOptions: {
            day: "numeric",
            month: "numeric",
            weekday: null,
            year: "numeric"
        },
        ignoreOnFocus: false,
        initDate: null,
        locale: "en-GB",
        sundayFirst: false,
        yearSwitchable: false
    };
}

function buildActions(hasYearActions) {
    let currentMonth = document.createElement("div");
    let actions = defaultActions;
    const result = document.createElement("div");
    if (hasYearActions === false) {
        actions = defaultActions.slice(1, 3);
    }
    currentMonth.classList.add("month-display");
    currentMonth.dataset.display = "currentMonth";
    result.classList.add("actions");
    actions = actions.map(function (action) {
        let btn = document.createElement("button");
        btn.dataset.action = action;
        btn.type = "button";
        btn.setAttribute("aria-label", "switch to " + action);
        btn.classList.add("inline-padding", "control");
        return btn;
    });
    actions = actions.slice(0, 2).concat([currentMonth]).concat(
        actions.slice(2)
    );
    actions.forEach((action) => result.appendChild(action));
    return result;
}

function buildCalendarGrid({actionBuilder, getDayNames}) {
    const grid = document.createElement("div");
    let actions = actionBuilder();
    let names = getDayNames().map(function ({abbreviation, name}) {
        let abbr;
        let result = document.createElement("div");
        abbr = document.createElement("abbr");
        abbr.setAttribute("title", abbreviation);
        abbr.textContent = name;
        result.classList.add("day-name", "flow-row");
        result.appendChild(abbr);
        return result;
    });
    let numbers = new Array(42).fill(0).map(function () {
        let button = document.createElement("button");
        button.type = "button";
        button.classList.add("date");
        return button;
    });
    grid.classList.add("calendar-grid");
    grid.appendChild(actions);
    names.concat(numbers).forEach((elt) => grid.appendChild(elt));
    grid.setAttribute("lang", "en")
    return grid;
}

function isLeapYear(year) {
    return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
}

function endingDay(currentDay, sundayFirst) {
    if (sundayFirst) {
        return currentDay;
    }
    return (
        currentDay === 0
        ? 6
        : currentDay - 1
    );
}

function daysInMonth(month, year) {
    const monthsWith31 = [1, 3, 5, 7, 8, 10, 12];
    const monthsWith30 = [4, 6, 9, 11];
    if (month < 1 || month > 12) {
        return 0;
    }
    if (monthsWith30.includes(month)) {
        return 30;
    }
    if (monthsWith31.includes(month)) {
        return 31;
    }
    return (
        isLeapYear(year)
        ? 29
        : 28
    );
}

function parseDate(date) {
    let newDate;
    if (!Number.isFinite(Date.parse(date))) {
        newDate = new Date();
    } else {
        newDate = new Date(Date.parse(date));
    }
    return {
        value: newDate,
        with({date, month, year}) {
            newDate.setFullYear(
                year ?? newDate.getFullYear(),
                month ?? newDate.getMonth(),
                date ?? newDate.getDate()
            );
            return newDate;
        }
    };
}

function calendarDay(day, currentMonth) {
    return {
        active: day.getMonth() === currentMonth,
        content: day.getDate(),
        date: day
    };
}

function generateDays(firstDayOfMonth, sundayFirst) {
    let index = 0;
    let tmpDate;
    let result = [];
    const dateObj = {};
    if (!Number.isFinite(Date.parse(firstDayOfMonth))) {
        return result;
    }
    dateObj.initialDate = parseDate(firstDayOfMonth).value;
    dateObj.currentDay = dateObj.initialDate.getDay();
    dateObj.currentMonth = dateObj.initialDate.getMonth();
    dateObj.previousDay = parseDate(firstDayOfMonth).with({
        date: dateObj.initialDate.getDate() - 1
    });
    dateObj.thisMonthDays = daysInMonth(
        dateObj.initialDate.getMonth() + 1,
        dateObj.initialDate.getFullYear()
    );
    dateObj.previousMonthDays = daysInMonth(
        dateObj.previousDay.getMonth() + 1,
        dateObj.previousDay.getFullYear()
    );
    dateObj.endDay = endingDay(dateObj.currentDay, sundayFirst);
    while (index < dateObj.endDay) {
        tmpDate = parseDate(dateObj.previousDay).with({
            date: dateObj.previousMonthDays
        });
        result.unshift(calendarDay(tmpDate, dateObj.currentMonth));
        dateObj.previousMonthDays -= 1;
        index += 1;
    }
    index = 0;
    while (index < dateObj.thisMonthDays) {
        tmpDate = parseDate(dateObj.initialDate).with({date: index + 1});
        result.push(calendarDay(tmpDate, dateObj.currentMonth));
        index += 1;
    }
    index = 0;
    dateObj.nextMonthDays = 42 - result.length;
    dateObj.initialDate.setMonth(dateObj.currentMonth + 1);
    while (index < dateObj.nextMonthDays) {
        tmpDate = parseDate(dateObj.initialDate).with({date: index + 1});
        result.push(calendarDay(tmpDate, dateObj.currentMonth));
        index += 1;
    }
    return result;
}
/*jslint-disable*/
class Datepicker extends HTMLElement {
    #config;
    #shown = false;
    #selectedDate;
    #displayedDate;
    #currentMonth;
    #container;
    #formatter

    static define(name = "date-picker") {
        if (typeof window.customElements === "object") {
            window.customElements.define(name, Datepicker);
        } else {
            console.warn("custom elements are not supported in this browser");
        }
    }
    constructor () {
        let self;
        super();
        self = this;
        this.#config = getInitialConfig();
        this.getAttributeNames().forEach(function (attr) {
            const isGeneric = self.#config[attributeMap[attr]] !== undefined;
            const dateEquiv= self.#config.dateOptions[dateAttributeMap[attr]];
            const value = self.getAttribute(attr);
            if (!isGeneric && dateEquiv === undefined) {
                return;
            }
            if (isGeneric && value.length === 0) {
                self.#config[attributeMap[attr]] = true;
            } else {
                self.#config[attributeMap[attr]] = value;
            }
            if (dateEquiv !== undefined && value.length !== 0) {
                self.#config.dateOptions[dateAttributeMap[attr]] = value;
            }
        });
        try {
            this.#formatter = this.#getFormatter(this.#config);
        } catch (ignore) {
            this.#formatter = this.#getFormatter(getInitialConfig());
        }
    }

    static get observedAttributes () {
        return ["data-show"];
    }

    #getFormatter(config) {
        const options = config.dateOptions;
        options.weekday = options.weekday ?? undefined;
        return new Intl.DateTimeFormat(config.locale ?? undefined, options);
    }

    attributeChangedCallback (ignore, oldValue, newValue) {
        if (oldValue === newValue) {
            return;
        }
        if (this.#shown === true && newValue === null) {
            this.dataset.show = "";
        }
        if (this.#shown === false && typeof newValue === "string") {
            delete this.dataset.show;
        }
    }

    connectedCallback () {
        if (this.isConnected) {
            this.init();
        }
    }

    #renderCalendar() {
        const selectedDate = this.#selectedDate;
        let firstDay = parseDate(this.#displayedDate).with({date: 1});
        let dates = this.querySelectorAll("button.date");
        let days = generateDays(firstDay, this.#config.sundayFirst);
        this.#currentMonth.textContent = monthNames[firstDay.getMonth()];
        this.#currentMonth.textContent += " " + firstDay.getFullYear();
        dates.forEach(function (date, index) {
            let day = days[index];
            if (day === undefined) {
                return;
            }
            if (areSameDay(new Date(), day.date)) {
                date.classList.add("today");
            } else {
                date.classList.remove("today");
            }
            if (areSameDay(day.date, selectedDate)) {
                date.classList.add("selected");
            } else {
                date.classList.remove("selected");
            }
            date.textContent = day.content;
            date.disabled = !day.active;
            date.date = day.date;
        });
    }

    #updateMonth(monthUpdater) {
        let month = monthUpdater(this.#displayedDate.getMonth());
        let year = this.#displayedDate.getFullYear();
        if (month < 0) {
            month = 12 + month;
            year -= 1;
        }
        if (month > 11) {
            month = 12 % month;
            year += 1;
        }
        this.#displayedDate.setFullYear(year, month, 1);
        this.#renderCalendar();
    }
    #updateYear(yearUpdater) {
        let year = yearUpdater(this.#displayedDate.getFullYear());
        let month = this.#displayedDate.getMonth();
        this.#displayedDate.setFullYear(year, month);
        this.#renderCalendar();
    }
    #showCalendar() {
        this.#shown = true;
        this.#renderCalendar();
        this.dataset.show = "";
        this.#container.focus();
    }

    init() {
        let mainContainer;
        const self = this;
        this.#config.input = this.querySelector('input')
        if (this.#config.input === null || this.#container !== undefined) {
            return;
        }
        this.#displayedDate = parseDate(this.#config.initDate).value;

        mainContainer = buildCalendarGrid({
            actionBuilder: () => buildActions(this.#config.yearSwitchable),
            getDayNames: () => dayNames(this.#config.sundayFirst)
        });
        this.addEventListener("focusout", function (event) {
            const {relatedTarget, target} = event;
            const shouldStop = (
                relatedTarget !== null
                && (
                    relatedTarget.parentElement === target
                    || relatedTarget.parentElement.parentElement === target
                )
            );
            if (target.classList.contains("calendar-grid")) {
                if (shouldStop) {
                    return;
                }
                this.#shown = false;
                delete this.dataset.show;
            }
        });
        this.#currentMonth = mainContainer.querySelector("[data-display]");
        this.addEventListener("click", function (event) {
            const {target} = event;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (target.classList.contains("date")) {
                this.#selectedDate = target.date;
                this.#config.input.value = this.#formatter.format(target.date);
                this.#shown = false;
                delete this.dataset.show;
            }
            if (target.dataset.action === defaultActions[1]) {
                this.#updateMonth((month) => month - 1);
            }
            if (target.dataset.action === defaultActions[2]) {
                this.#updateMonth((month) => month + 1);
            }
            if (target.dataset.action === defaultActions[0]) {
                this.#updateYear((year) => year - 1);
            }
            if (target.dataset.action === defaultActions[3]) {
                this.#updateYear((year) => year + 1);
            }
        });
        this.addEventListener("focusin", function ({target}) {
            if (target === this.#config.input && !this.#config.ignoreOnFocus) {
                this.#showCalendar();
            }
        });
        this.#container = this.appendChild(mainContainer);
    }
    showPicker() {
        if (this.#config.ignoreOnFocus) {
            this.#showCalendar();
        }
    }
}
export default Datepicker;
/*jslint-enable*/
