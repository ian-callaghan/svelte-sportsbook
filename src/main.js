import App from "./App.svelte"
import "unfetch/polyfill"

const app = new App({
    target: document.body,
    props: {
        name: "world",
    },
})

export default app
