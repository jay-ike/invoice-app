import {For, createMemo, createSignal} from "solid-js";
import FormInvoiceItem from "./form-invoice-item";
import utils from "../utils.js";

function Indicator(props) {
    return (
        <ul class="step-indicator">
            <For each={props.steps}>
                {
                    (step, index) => <li class={props.current() >= index() ? "step-active" : ""}><p>{step}</p></li>
                }
            </For>
        </ul>
    );
}
function Drawer(props) {
    const generator = utils.numberGenerator();
    const components = Object.create(null);
    const steps = ["your informations", "your client informations", "terms of payments", "the billing items"];
    const [currentStep, setCurentStep] = createSignal(0);
    const [items, setItems] = createSignal(props.items ?? [{id: generator.next(), valid: false}]);
    const [formValid, setFormValidity] = createSignal(false);
    const itemAddition = createMemo(() => (
        items().some((elt) => elt.valid === false)
        ? {disabled: true}
        : {}
    ));
    const formValidity = createMemo( () => (
        formValid()
        ? {}
        : {disabled: true}
    ));
    function updateValidity(isValid, index) {
        const allItems = Array.from(items());
        allItems[index].valid = isValid;
        setItems(allItems);
    }
    function removeItem(index) {
        let all = items();
        all = all.slice(0, index).concat(all.slice(index + 1));
        if (all.length === 0) {
            all = [{id: generator.next(), valid: false}];
        }
        setItems(all);
    }
    function addItem() {
        setItems(items().concat([{id: generator.next(), valid: false}]));
        setFormValidity(components.form.checkValidity());
    }
    function requestNextFormStep() {
        const selector = "step-by-step > :not(.step-out) :is(input,select)";
        let inputFields = Array.from(components.form.querySelectorAll(selector));
        if (allFieldsValid(inputFields)) {
            components.form.firstElementChild.nextStep();
        }
    }
    function allFieldsValid(fields) {
        return fields.every(function (field) {
            delete field.dataset.new;
            return field.checkValidity();
        });
    }
    function stepUpdater({detail}) {
        const {current} = detail;
        if (current > 0) {
            components.prev.disabled = false;
        } else {
           components.prev.disabled = true;
        }
        if (current === steps.length - 1) {
            components.next.disabled = true;
        } else {
            components.next.disabled = false;
        }
        setCurentStep(current);
    }
    function previousStep() {
        components.form.firstElementChild.previousStep();
    }
    function discardDrawer() {
        props.onClose();
    }
    function parseDescriptor(lookupProps) {
        return Object.entries(props.descriptor).filter(
            ([key, val]) => lookupProps.includes(key) && val !== null
        ).reduce(function descriptorReducer(acc, [key, val]) {
            acc["data-" + key] = val;
            return acc;
        }, Object.create(null));
    }
    function handleInput({target}) {
        if (target.dataset.new === undefined) {
            target.dataset.new = "";
        }
        setFormValidity(components.form.checkValidity());
    }
    return (
            <section class="drawer box column" data-emit="draweropened" data-attributes="data-edit:{edit},data-status:{status}" {...parseDescriptor(["status", "edit"])}>
               <h2 class="heading-l"><span data-event="draweropened" data-property="{action}">{props.descriptor.action}</span><span class="invoice__ref" data-prefix="#" data-event="draweropened" data-property="{reference}">{props.descriptor.reference ?? ""}</span></h2>
               <Indicator current={currentStep} steps={steps} />
               <span class="segragator no-gap no-padding">
					<button ref={components.prev} aria-label="previous step" class="box row icon-start" id="prev_step" type="button" data-icon="arrow_left" disabled="true" autocomplete="off" onClick={previousStep}>previous step</button>
					<button ref={components.next} aria-label="next step" class="box row icon-end" id="next_step" type="button" data-icon="arrow_right" onClick={requestNextFormStep}>next step</button>
               </span>
               <form ref={components.form} id="invoice_form" action="" class="grow-2 y-scrollable" onInput={handleInput}>
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
							<input type="email" id="bt-email" name="clientMail" autocomplete="email" data-new required />
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
                        <For each={items()} key="id">
                            {
                                function itemBuilder(validity, index) {
                                    return <FormInvoiceItem index={index} updateValidity={updateValidity} isValid={validity} onRemove={removeItem}/>
                                }
                            }
                        </For>
                        <button aria-label="add new item" type="button" class="large-btn box" data-prefix="+ " {...itemAddition()} onClick={addItem}>add new item</button>
                    </div>
                   </step-by-step>
               </form>
               <div>
                   <button class="box btn-edit cancel" data-event="draweropened" data-property="{cancel}" data-attributes="aria-label:{cancel}" aria-label={props.descriptor.cancel} onClick={discardDrawer}>{props.descriptor.cancel}</button>
					<button aria-label="save as draft" class="box btn-draft">save as draft</button>
                    <button class="box btn-primary proceed" data-event="draweropened" data-property="{proceed}" data-attributes="aria-label:{proceed}" aria-label={props.descriptor.proceed} {...formValidity()} autocomplete="off">{props.descriptor.proceed}</button>
               </div>
            </section>
    );
}

export default Object.freeze(Drawer);
