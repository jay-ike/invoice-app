import {createMemo, createSignal} from "solid-js";

function invoiceItemField(props) {
    let field;
    const [price, setPrice] = createSignal(0);
    const [quantity, setQuantity] = createSignal(0);
    let total = createMemo(function totalCalulator() {
        let result = price() * quantity();
        if (Number.isFinite(result)) {
            return result;
        } else {
            return ""
        }
    });

    function handleInputs() {
        const isValid = Array.from(field.elements).filter(
            (elt) => elt.tagName.toLowerCase() === "input"
        ).every((elt) => elt.checkValidity());
        props.updateValidity(isValid, props.index());
    }

    return (
             <fieldset ref={field} class="input-step item-grid" name={"item-" + (props.index() + 1)} onInput={handleInputs}>
                 <div>
                     <input type="text" id={"item-" + (props.index() + 1) + "-name"} name={"item-" + (props.index() + 1) + "-name"} required data-new/>
				     <label for={"item-" + (props.index() + 1) + "-name"}>item name</label>
				 </div>
                 <div>
                     <input type="text" id={"item-" + (props.index() + 1) + "-qty"} name={"item-" + (props.index() + 1) + "-qty"} pattern="^\\d+$" inputmode="numeric" required data-new onInput={({target}) => setQuantity(target.value)}/>
		             <label for={"item-" + (props.index() + 1) + "-qty"}><abbr title="quantity">qty.</abbr></label>
                 </div>
                 <div>
                     <input type="text" id={"item-" + (props.index() + 1) + "-price"} name={"item-" + (props.index() + 1) + "-price"} pattern="^\\d+(\.\\d+)?$" inputmode="decimal" required data-new onInput={({target}) => setPrice(target.value)}/>
				     <label for="">price</label>
				 </div>
                 <div>
                     <output name={"item-" + (props.index() + 1) + "-total"} id={"item-" + (props.index() + 1) + "-total"} for={"item-" + (props.index() + 1) + "-qty item-" + (props.index() + 1) + "-price"}>{total()}</output>
				     <label for={"item-" + (props.index() + 1) + "-total"}>total</label>
				</div>
                <button class="box no-padding icon-start" data-icon="delete" aria-label="delete the invoice item" type="button" onClick={() => props.onRemove(props.index())}></button>
             </fieldset>
    );
}

export default invoiceItemField;