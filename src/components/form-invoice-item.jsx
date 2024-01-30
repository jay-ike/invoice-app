import {createMemo, createSignal} from "solid-js";
import utils from "../utils.js";

function invoiceItemField(props) {
    const formatter = utils.getFormatter();
    const [price, setPrice] = createSignal();
    const [quantity, setQuantity] = createSignal();
    let total = createMemo(function totalCalulator() {
        if (Number.isFinite(price()) && Number.isFinite(quantity())) {
            return formatter.format(price() * quantity());
        } else {
            return ""
        }
    });
    return (
             <fieldset class="invoice-grid input-step inv-item" name="item-1">
                 <div>
                     <input type="text" id="item-1-name" name="item-1-name" required data-new/>
				     <label for="item-1-name">item name</label>
				 </div>
                 <div>
                     <input type="text" id="item-1-qty" name="item-1-qty" pattern="^\d+$" inputmode="numeric" required data-new onInput={({target}) => setQuantity(target.value)}/>
		             <label for="item-1-qty"><abbr title="quantity">qty.</abbr></label>
                 </div>
                 <div>
                     <input type="text" id="item-1-price" name="item-1-price" pattern="^\d+(\.\d+)?$" inputmode="decimal" required data-new onInput={({target}) => setPrice(target.value)}/>
				     <label for="">price</label>
				 </div>
                 <div>
                     <output name="item-1-total" id="item-1-total" for="item-1-qty item-1-price" value={total()}></output>
				     <label for="item-1-total">total</label>
				</div>
                 <button class="box no-padding icon-start" data-icon="delete" aria-label="delete the invoice item" type="button"></button>
             </fieldset>
    );
}

export default invoiceItemField;
