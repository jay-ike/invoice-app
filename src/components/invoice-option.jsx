import utils from "../App.module.css";

function InvoiceOption(props) {
    function selectionHandler({target}) {
        if (target.checked === true) {
            props.onCheck(props.name);
        } else {
            props.onUncheck(props.name);
        }
    }
    return (
        <div class={"row " + utils["inv-option"]}>
          <span class="no-shrink">
            <input type="checkbox" name={props.name + "Selected"} id={props.id} onInput={selectionHandler}/>
            <svg viewBox="0 0 12 9">
                <path fill-rule="evenodd" clip-rule="evenodd" d="m1 4 3.433 3.433L10.866 1" fill="currentColor" style="fill:var(--icon-fill, currentColor);" id="path11" pathLength="1" stroke-width="2"/>
            </svg>
          </span>
          <label for={props.id}>{props.name}</label>
        </div>
    );
}

export default Object.freeze(InvoiceOption);
