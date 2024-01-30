import {createSignal} from "solid-js";
import Nav from "./components/header.jsx";
import InvoiceAdder from './components/invoice-adder';

function App() {
  const [invoices, setInvoices] = createSignal([]);
  return (
      <>
        <Nav/>
        <main>
            <section className="column box">
                <InvoiceAdder allInvoices={invoices}/>
            </section>
        </main>
      </>
  );
}

export default App;
