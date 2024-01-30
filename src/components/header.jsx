import {createEffect, createSignal} from "solid-js";
function getColorScheme() {
    return (
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    );
}
function Nav () {
    const themes = {light: "dark", dark: "light"};
    const [currentTheme, setCurrentTheme] = createSignal();
    createEffect(function themeUpdater(prev) {
        document.documentElement.dataset.theme = currentTheme();
    });
    function updateTheme() {
        setCurrentTheme(themes[currentTheme() ?? getColorScheme()]);
    }
    return (
        <header class="segragator banner">
            <div role="img" aria-label="Application Logo" id="logo">
            </div>
            <nav class="box row">
                <button aria-label="Theme switcher" class="box theme-switch" onClick={updateTheme}>
                </button>
                <svg width="32" height="32" class="self-center" viewBox="0 0 24 24">
                    <title>An Icon illustrating a user avatar</title>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M 22.2 12.1 A 10.1 10.1 90 0 1 12.1 22.2 A 10 10 90 0 1 2 12.1 A 10.1 10.1 90 1 1 22.2 12.1 Z M 12.1 19.2 A 7 7 90 0 0 17.1 17.1 A 5.9 5.9 90 0 0 12.1 14.2 A 5.9 5.9 90 0 0 7.1 17.1 A 7.1 7.1 90 0 0 12.1 19.2 Z M 12.1 12.1 A 3 3 90 1 0 12.1 6.1 A 3 3 90 0 0 12.1 12.1 Z" fill="currentColor" style="fill:var(--icon-fill, currentColor);" id="path4"/>
                </svg>
            </nav>
        </header>
    );
}

export default Object.freeze(Nav);
