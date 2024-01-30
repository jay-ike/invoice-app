import {For, createSignal} from "solid-js";
import style from "../App.module.css";
import FormInvoiceItem from "./form-invoice-item";

function Indicator(props) {
    return (
        <ul class={style["step-indicator"]}>
            <For each={props.steps}>
                {
                    (step, index) => <li class={props.current() >= index() ? style["step-active"] : ""}><p>{step}</p></li>
                }
            </For>
        </ul>
    );
}
function Drawer(props) {
    const components = Object.create(null);
    const steps = ["your informations", "your client informations", "terms of payments", "the billing items"];
    const [currentStep, setCurentStep] = createSignal(0);
    components.stepper = () => document.querySelector("." + props.name + " step-by-step");
    components.prev = () => document.querySelector("#prev_step");
    components.next = () => document.querySelector("#next_step");
    function stepUpdater({detail}) {
        const {current} = detail;
        const prevBtn = components.prev();
        const nextBtn = components.next();
        if (current > 0) {
            prevBtn.disabled = false;
        } else {
           prevBtn.disabled = true;
        }
        if (current === steps.length - 1) {
            nextBtn.disabled = true;
        } else {
            nextBtn.disabled = false;
        }
        setCurentStep(current);

    }
    function previousStep() {
        components.stepper().previousStep();
    }
    function nextStep() {
        components.stepper().nextStep();
    }
    function discardDrawer() {
        props.onClose();
    }
    return (
            <section class={props.name + " box column"} data-emit="draweropened" data-attributes="data-edit:{edit},data-status:{status}">
               <h2 class="heading-l"><span data-event="draweropened" data-property="{action}"></span><span class="invoice__ref" data-prefix="#" data-event="draweropened" data-property="{reference}"></span></h2>
               <Indicator current={currentStep} steps={steps} />
               <span class="segragator no-gap no-padding">
					<button aria-label="previous step" class="box row icon-start" id="prev_step" type="button" data-icon="arrow_left" disabled="true" autocomplete="off" onClick={previousStep}>previous step</button>
					<button aria-label="next step" class="box row icon-end" id="next_step" type="button" data-icon="arrow_right" onClick={nextStep}>next step</button>
               </span>
               <form id="invoice_form" action="" class="grow-2 y-scrollable">
                 <step-by-step out-indicator="step-out" on:indexupdated={stepUpdater}>
                   <fieldset class="input-step stack" name="senderInfos">
                        <legend>bill from</legend>
                        <div><input type="text" id="bf-street" name="senderAddress" autocomplete="address-line1"/><label for="bf-street">street address</label></div>
                        <div><input type="text" id="bf-city" name="senderCity" autocomplete="address-level2"/><label for="bf-city">city</label></div>
                        <div><input type="text" id="bf-post-code" name="senderPostCode" autocomplete="postal-code"/><label for="bf-post-code">post code</label></div>
                        <div><input type="text" id="bf-country" name="senderCountry" autocomplete="country-name"/><label for="bf-country">country</label></div>
                    </fieldset>
                    <fieldset class="input-step stack" name="clientInfos">
                        <legend>bill to</legend>
                        <div><input type="text" id="bt-name" name="clientName" autocomplete="name" data-new required/><label for="bt-name" data-error="can't be empty">client's name</label></div>
                        <div>
							<input type="email" id="bt-email" name="clientMail" autocomplete="email" data-new required pattern="^[a-zA-Z0-9\._%\+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}$"/>
							<label for="bt-email" data-error="invalid email address">client's email</label>
						</div>
                        <div><input type="text" id="bt-street" name="clientAddress" autocomplete="address-line1"/><label for="bt-street">street address</label></div>
                        <div><input type="text" id="bt-city" name="clientCity" autocomplete="address-level2"/><label for="bt-city">city</label></div>
                        <div><input type="text" id="bt-post-code" name="clientPostCode" autocomplete="postal-code"/><label for="bt-post-code">post code</label></div>
                        <div><input type="text" id="bt-country" name="clientCountry" autocomplete="country-name"/><label for="bt-country">country</label></div>
                    </fieldset>
                    <fieldset class="input-step stack" name="terms">
                        <legend>payment terms</legend>
                        <date-picker month-format="short" locale="en-GB">
                            <input type="text" id="inv-date" name="invoiceDate" autocomplete="off" data-new required/>
                            <label for="inv-date" data-error="no date selected">invoice date</label>
                        </date-picker>
                        <div>
                            <select name="paymentTerms" id="inv-terms" autocomplete="off" data-new required>
                                <option value="" class="blank-box" label="select your term" selected/>
                                <option class="blank-box" value="1" label="net 1 day"/>
                                <option class="blank-box" value="7" label="net 7 days"/>
                                <option class="blank-box" value="14" label="net 14 days"/>
                                <option class="blank-box" value="30" label="net 30 days"/>
                            </select>
                            <label for="inv-terms" data-error="no term selected">payment terms</label>
                        </div>
                        <div><input type="text" id="inv-desc" name="description" data-new required/><label for="inv-desc" data-error="no description specified">project description</label></div>
                    </fieldset>
                    <div class="stack">
                        <h3 class="heading-m primary-text">item list</h3>
                        <FormInvoiceItem />
                        <button aria-label="add new item" type="button" class="large-btn box" data-prefix="+ ">add new item</button>
                    </div>
                   </step-by-step>
               </form>
               <div>
                   <button class="box btn-edit cancel" data-event="draweropened" data-property="{cancel}" data-attributes="aria-label:{cancel}" aria-label="cancel" onClick={discardDrawer}></button>
					<button aria-label="save as draft" class="box btn-draft">save as draft</button>
                    <button class="box btn-primary proceed" data-event="draweropened" data-property="{proceed}" data-attributes="aria-label:{proceed}" aria-label="save & send" disabled="true" autocomplete="off">save & send</button>
               </div>
            </section>
    );
}

export default Object.freeze(Drawer);
