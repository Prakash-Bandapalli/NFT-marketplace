import React, { useEffect, useState } from "react";
import logo from "../../assets/logo.png";
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../declarations/nft";
import { idlFactory as tokenIdlFactory } from "../../../declarations/token";
import { Principal } from "@dfinity/principal";
import { opend } from "../../../declarations/opend"
import Button from "./Button";
import CURRENT_USER_ID from "../index";
import PriceLabel from "./PriceLabel";
function Item({ id, role }) {

  const [name, setName] = useState();
  const [owner, setOwner] = useState();
  const [image, setImage] = useState();
  const [button, setButton] = useState();
  const [input, setInput] = useState();
  const [isLoaded, setIsLoaded] = useState(true);
  const [blur, setBlur] = useState();
  const [sellStatus, setSellStatus] = useState();
  const [priceLabel, setPriceLabel] = useState();

  const principal = id;
  const localHost = "http://localhost:8080/";
  const agent = new HttpAgent({ host: localHost });
  agent.fetchRootKey();

  let NFTActor;
  async function loadNFT() {
    NFTActor = await Actor.createActor(idlFactory, {
      agent,
      canisterId: principal,
    });
    const name = await NFTActor.getName();
    const owner = await NFTActor.getOwner();
    const imageData = await NFTActor.getAsset();
    const imageContent = new Uint8Array(imageData);
    const image = URL.createObjectURL(new Blob([imageContent.buffer], { type: "image/png" }));
    setName(name);
    setOwner(owner.toText());
    setImage(image);
    if (role == "collection") {
      const nftIsListed = await opend.isListed(principal);
      if (nftIsListed) {
        setOwner("OpenD");
        setBlur({
          filter: "blur(4px)"
        });
        setSellStatus("Listed");
      } else {
        setButton(<Button handleClick={handleSell} text={"Sell"} />);
      }
    } else if (role == "discover") {
      const originalOwner = await opend.getOriginalOwner(principal);
      if (originalOwner.toText() != CURRENT_USER_ID.toText()) {
        setButton(<Button handleClick={handleBuy} text={"Buy"} />);
      }

      const itemPrice = await opend.getListedNFTPrice(principal);
      console.log(itemPrice);
      setPriceLabel(<PriceLabel price={itemPrice.toString()} />);
    }
  }

  useEffect(() => {
    loadNFT();
  }, []);

  let price;
  function handleSell() {
    console.log("yo bro i got clicked");
    setInput(<input
      placeholder="Price in GOMU"
      type="number"
      className="price-input"
      value={price}
      onChange={e => price = e.target.value}
    />);
    setButton(<Button handleClick={sellItem} text={"Confirm"} />);
  }

  async function sellItem() {
    setIsLoaded(false);
    setBlur({
      filter: "blur(4px)"
    })
    console.log(`set price = ${price}`);
    const listingResult = await opend.listItem(principal, parseInt(price));
    console.log("listing: " + listingResult);
    if (listingResult == "Success") {
      const openDId = await opend.getOpenDCanisterId();
      const transferResult = await NFTActor.transferOwnership(openDId);
      console.log("transfer: " + transferResult);
      if (transferResult == "Success") {
        setIsLoaded(true);
        setInput();
        setButton();
        setOwner("OpenD");
      }
    }
  }

  async function handleBuy() {
    console.log("hey yo bois i got trigged");
    const tokenActor = await Actor.createActor(tokenIdlFactory, {
      agent,
      canisterId: Principal.fromText("rrkah-fqaaa-aaaaa-aaaaq-cai"),
    });
    const sellerID = await opend.getOriginalOwner(principal);
    const price = await opend.getListedNFTPrice(principal);

    const result = await tokenActor.transfer(principal, price);
    console.log(result);
  }

  return (
    <div className="disGrid-item">
      <div className="disPaper-root disCard-root makeStyles-root-17 disPaper-elevation1 disPaper-rounded">
        <img style={blur}
          className="disCardMedia-root makeStyles-image-19 disCardMedia-media disCardMedia-img"
          src={image}
        />
        <div hidden={isLoaded} className="lds-ellipsis">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>

        <div className="disCardContent-root">
          {priceLabel}
          <h2 className="disTypography-root makeStyles-bodyText-24 disTypography-h5 disTypography-gutterBottom">
            {name}<span className="purple-text"> {sellStatus}</span>
          </h2>
          <p className="disTypography-root makeStyles-bodyText-24 disTypography-body2 disTypography-colorTextSecondary">
            Owner: {owner}
          </p>
          {input}
          {button}
        </div>
      </div>
    </div>
  );
}

export default Item;
