import React from "react";
function PriceLabel({ price }) {
    return (
        <div className="disButtonBase-root disChip-root makeStyles-price-23 disChip-outlined">
            <span className="disChip-label">{price} GOMU</span>
        </div>
    )
}

export default PriceLabel;
