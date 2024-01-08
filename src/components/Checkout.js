import { CreditCard, Delete } from "@mui/icons-material";
import {
  Button,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { config } from "../App";
import Cart, { getTotalCartValue, generateCartItemsFrom ,getTotalItems} from "./Cart";
import "./Checkout.css";
import Footer from "./Footer";
import Header from "./Header";

const AddNewAddressView = ({token,newAddress,handleNewAddress,addAddress,}) => {
  // console.log("param newAddress",newAddress);
  return (
    <Box display="flex" flexDirection="column">
      <TextField
        multiline
        minRows={4}
        onChange={(e)=>{handleNewAddress({value:e.target.value})}}
        placeholder="Enter your complete address"
      />
      <Stack direction="row" my="1rem">
        <Button
          variant="contained"
          onClick={(e)=>{addAddress(token,newAddress.value); handleNewAddress({isAddingNewAddress:false,value:""})} }
        >
          Add
        </Button>
        <Button
          variant="text"
          onClick={(e)=>{handleNewAddress((curr)=>({...curr,isAddingNewAddress:false,value:""}))}}
        >
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};

const Checkout = () => {
  const token = localStorage.getItem("token");
  let classname="address-item ";
  const history = useHistory();
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [addresses, setAddresses] = useState({ all: [], selected: "" });
  const [newAddress, setNewAddress] = useState({
    isAddingNewAddress: false,
    value: "",
  });

  // Fetch the entire products list
  const getProducts = async () => {
    try {
      const response = await axios.get(`${config.endpoint}/products`);

      setProducts(response.data);
      return response.data;
    } catch (e) {
      if (e.response && e.response.status === 500) {
        enqueueSnackbar(e.response.data.message, { variant: "error" });
        return null;
      } else {
        enqueueSnackbar(
          "Could not fetch products. Check that the backend is running, reachable and returns valid JSON.",
          {
            variant: "error",
          }
        );
      }
    }
  };

  // Fetch cart data
  const fetchCart = async (token) => {
    if (!token) return;
    try {
      const response = await axios.get(`${config.endpoint}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch {
      enqueueSnackbar(
        "Could not fetch cart details. Check that the backend is running, reachable and returns valid JSON.",
        {
          variant: "error",
        }
      );
      return null;
    }
  };


  const getAddresses = async (token) => {
    if (!token) return;

    try {
      const response = await axios.get(`${config.endpoint}/user/addresses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAddresses({ ...addresses, all: response.data });
      return response.data;
    } catch {
      enqueueSnackbar(
        "Could not fetch addresses. Check that the backend is running, reachable and returns valid JSON.",
        {
          variant: "error",
        }
      );
      return null;
    }
  };


  const addAddress = async (token, newAddress) => {
    try {
      // TODO: CRIO_TASK_MODULE_CHECKOUT - Add new address to the backend and display the latest list of addresses
      let url=config.endpoint+'/user/addresses';
      let res=await axios.post(url,{"address":newAddress},{headers:{Authorization:`Bearer ${token}`}});
      setAddresses({all: res.data ,isAddingNewAddress:false});
      return res.data;

    } catch (e) {
      if (e.response) {
        enqueueSnackbar(e.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar(
          "Could not add this address. Check that the backend is running, reachable and returns valid JSON.",
          {
            variant: "error",
          }
        );
      }
    }
  };


  const deleteAddress = async (token, addressId) => {
    try {
      // TODO: CRIO_TASK_MODULE_CHECKOUT - Delete selected address from the backend and display the latest list of addresses
      let url=config.endpoint+'/user/addresses/'+addressId;
      let res=await axios.delete(url,{headers:{Authorization:`Bearer ${token}`}});
      setAddresses({ ...addresses, all: res.data });
      return res.data;

    } catch (e) {
      if (e.response) {
        enqueueSnackbar(e.response.data.message, { variant: "error" });
      } else {
        enqueueSnackbar(
          "Could not delete this address. Check that the backend is running, reachable and returns valid JSON.",
          {
            variant: "error",
          }
        );
      }
    }
  };

  
  const validateRequest = (items, addresses) => {

    if(getTotalCartValue(items)>localStorage.getItem("balance")){
      enqueueSnackbar(`You do not have enough balance in your wallet for this purchase`,{variant:"warning"})
      return false;
    }else if(addresses.all.length===0){
      enqueueSnackbar(`Please add a new address before proceeding.`,{variant:"warning"})
      return false;
    }else if(!addresses.selected){
      enqueueSnackbar(`Please select one shipping address to proceed.`,{variant:"warning"})
      return false;
    }
    return true;

  };

  
  const performCheckout = async (token, items, addresses) => {
    let isValid=validateRequest(items,addresses);
    if(isValid){
      try {
        // TODO: CRIO_TASK_MODULE_CHECKOUT - Add new address to the backend and display the latest list of addresses
        // 
        let url=config.endpoint+'/cart/checkout';
        let res=await axios.post(url, {"addressId":addresses.selected},{headers:{Authorization:`Bearer ${token}`}});
        // return res.data;

        if(res.data){
          let wallet=localStorage.getItem('balance');
          let remain=wallet-getTotalCartValue(items);
          localStorage.setItem("balance",remain);
          history.push("/thanks")
        }

      } catch (e) {
        if (e.response) {
          enqueueSnackbar(e.response.data.message, { variant: "error" });
        } else {
          enqueueSnackbar(
            "Could not add this address. Check that the backend is running, reachable and returns valid JSON.",
            {
              variant: "error",
            }
          );
        }
      }
    }
  };

  
  useEffect(() => {
    const onLoadHandler = async () => {
      const productsData = await getProducts();
      const cartData = await fetchCart(token);
      if (productsData && cartData) {
        const cartDetails = await generateCartItemsFrom(cartData, productsData);
        setItems(cartDetails);
      }
    
    };
    onLoadHandler();
    
  }, []);

  useEffect(() => {
    if (token) {
      getAddresses(token);
    } else {
      enqueueSnackbar("You must be logged in to access checkout page", {
        variant: "info",
      });
      history.push("/");
    }
    
  }, [token]);


  return (
    <>
      <Header />
      <Grid container>
        <Grid item xs={12} md={9}>
          <Box className="shipping-container" minHeight="100vh">
            <Typography color="#3C3C3C" variant="h4" my="1rem">
              Shipping
            </Typography>
            <Typography color="#3C3C3C" my="1rem">
              Manage all the shipping addresses you want. This way you won't
              have to enter the shipping address manually with every order.
              Select the address you want to get your order delivered.
            </Typography>
            <Divider />
            <Box>
             
                

              {
                addresses.all.length!==0?
                      (addresses.all.map((add)=>
                          // console.log(add["address"])
                          {if(addresses.selected === add["_id"])
                            classname = "address-item selected"
                          else
                            classname = "address-item not-selected"
                         return ( <div className={classname} onClick={(e)=>{setAddresses({...addresses,selected:add["_id"]})}}  key={add["_id"]}>
                            <p my="1rem" >{add["address"]}</p>
                            <Button 
                              startIcon={<Delete />} 
                              id={add["_id"]}
                              onClick={(e)=>{deleteAddress(token,e.target.id)}}
                              >
                                Delete
                            </Button>
                          </div>)
                          }
                      ))
                  :
                  (<Typography my="1rem">
                    No addresses found for this account. Please add one to proceed
                  </Typography>)
              }
            </Box>

            
            
            {
              newAddress.isAddingNewAddress===false?
                (
                    <Button
                      color="primary"
                      variant="contained"
                      id="add-new-btn"
                      size="large"
                      onClick={() => {
                        setNewAddress((currNewAddress) => ({
                          ...currNewAddress,
                          isAddingNewAddress: true,
                        }));
                      }}
                     >
                     Add new address
                    </Button>
                )
                :
                (
                  <AddNewAddressView token={token} newAddress={newAddress} handleNewAddress={setNewAddress} addAddress={addAddress} />
                )
            }
            
            <Typography color="#3C3C3C" variant="h4" my="1rem">
              Payment
            </Typography>
            <Typography color="#3C3C3C" my="1rem">
              Payment Method
            </Typography>
            <Divider />

            <Box my="1rem">
              <Typography>Wallet</Typography>
              <Typography>
                Pay ${getTotalCartValue(items)} of available $
                {localStorage.getItem("balance")}
              </Typography>
            </Box>

            <Button
              startIcon={<CreditCard />}
              variant="contained"
              onClick={(e)=>{performCheckout(token,items,addresses)}}
            >
              PLACE ORDER
            </Button>
          </Box>
        </Grid>
        <Grid item xs={12} md={3} bgcolor="#E9F5E1">
          <Cart isReadOnly products={products} items={items} />
          <Box className="cart" p={1}>
            <h2>Order Details</h2>
            <table  >
            <tr>
              <td>Products</td>
              <td>{getTotalItems(items)}</td>
            </tr>
            <tr>
              <td>SubTotal</td>
              <td>${getTotalCartValue(items)}</td>
            </tr>
            <tr>
              <td>Shipping Charges</td>
              <td>$0</td>
            </tr>
            <tr>
              <td><h3>Total</h3></td>
              <td><h3>${getTotalCartValue(items)}</h3></td>
            </tr>
          </table>
          </Box>
        </Grid>
      </Grid>
      <Footer />
    </>     
    
  );
};

export default Checkout;
