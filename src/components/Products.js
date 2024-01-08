import { Button, Stack,Avatar } from "@mui/material";
import { Search, SentimentDissatisfied } from "@mui/icons-material";
import {
  CircularProgress,
  Grid,
  Card,
  InputAdornment,
  TextField,
} from "@mui/material";
import { Box } from "@mui/system";
import axios from "axios";
import { useSnackbar } from "notistack";
import React, { useEffect, useState ,useCallBack} from "react";
import { config } from "../App";
import Footer from "./Footer";
import Header from "./Header";
import "./Products.css";
import ProductCard from "./ProductCard";
import Cart,{generateCartItemsFrom} from "./Cart";




const Products = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [productData,updateProduct]=useState([]);
  const [isFetching,updateFecthed]=useState(false);
  const [productNotFound,updateProductNotFound]=useState(false);
  const [timerId,udpateTimerId]=useState("");
  const [userLoggedIn,updateUserLoggedIn]=useState(false);
  const [cartData,updateCartData]=useState([]);
  const [userCartItems,updateUserCartItems]=useState([]);
  const [userToken,updateUserToken]=useState("");

  
  const performAPICall = async () => {
    try{
      updateFecthed(true)
      let url=config.endpoint;
     let product= await axios.get(`${url}/products`);
     updateProduct(product.data);
     updateFecthed(false);
     return product.data;
    }catch(e){
      console.log(e.message)
    }
  
  };

  

  const performSearch = async (text) => {
    try{
      // updateProductNotFound(false)
      let url=config.endpoint;
     let product= await axios.get(`${url}/products/search?value=${text}`).catch((e)=>{updateProductNotFound(true)})
     
     if(product.data){
      updateProductNotFound(false);
      updateProduct(product.data);
     }
    }catch(e){
      console.log(e.message)
    }
  };


  const debounceSearch = (event, debounceTimeout) => {
    clearTimeout(debounceTimeout);
    let timerId = setTimeout(() => performSearch(event), 500);
    udpateTimerId(timerId);
  };

  useEffect( ()=>{
    async function onLoad(){
       const product=await performAPICall();
      let user=localStorage.getItem('username');
      {user && updateUserLoggedIn(true)} 
      let token=localStorage.getItem('token');
      if(token){
        updateUserToken(token);
        const cartItems=await fetchCart(token);
        //console.log()
        updateUserCartItems(cartItems);// Array of objects with productId and quantity of products in cart
        const cartData=await generateCartItemsFrom(cartItems,product)
        updateCartData(cartData);
      }
    }
    onLoad();
  },[])

 



 const fetchCart = async (token) => {
  if (!token) return;

  try {
    
   let url=config.endpoint+'/cart';
   let cartDatas=await axios.get(url,{headers:{Authorization:`Bearer ${token}`}});
   return cartDatas.data;

  } catch (e) {
    if (e.response && e.response.status === 400) {
      enqueueSnackbar(e.response.data.message, { variant: "error" });
    } else {
      enqueueSnackbar(
        "Could not fetch cart details. Check that the backend is running, reachable and returns valid JSON.",
        {
          variant: "error",
        }
      );
    }
    return null;
  }
};



const isItemInCart = (items, productId) => {
  // items is whole data array
  for(let i=0;i<items.length;i++){
    // console.log(items[i])
      if(items[i]['_id']===productId){
        enqueueSnackbar('Item already in cart. Use the cart sidebar to update quantity or remove item.',{variant:"warning"});
        return true;
      }
  }
  return false;
};


const addToCart = async (token, items,products,productId,qty,options = { preventDuplicate: false }) => {

      if(options.preventDuplicate===true){
        try{
            let url=config.endpoint+'/cart';
            let res=await axios.post(url,{"productId":productId,"qty":qty},{headers:{Authorization:`Bearer ${token}`}});
            const cartData=await generateCartItemsFrom(res.data,products)
            updateCartData(cartData);

        }catch(e){
          console.log(e)
        }
      }
      else {
            // udpate only quantity
            // items.qty++
            let index;
            for(let i=0;i<items.length;i++){
              if(items[i]['productId']===productId){
                index=i;
              }
            }
            if(options.preventDuplicate==='handleAdd'){
              items[index]['qty']++;
            }
            else{
                items[index]['qty']--;
            }
            //  udpate ite4ms
            let url=config.endpoint+'/cart';
            let res=await axios.post(url,{"productId":productId,"qty":items[index]["qty"]},{headers:{Authorization:`Bearer ${token}`}});
            const cartData=await generateCartItemsFrom(res.data,products)
            updateCartData(cartData);
      }
};


let addItems=(e)=>{
  {!userLoggedIn && enqueueSnackbar("Login to add an item to the Cart",{variant:"warning"}) };
  if(userLoggedIn){
    let result=isItemInCart(cartData,e.target.value)
    if(!result){
      addToCart(userToken,userCartItems,productData,e.target.value,1,{preventDuplicate: true});
    }else{
      enqueueSnackbar('Item already in cart. Use the cart sidebar to update quantity or remove item.',{variant:"warning"});
    }
  }
  
  
}

const onButtonClick=(id,handle)=>{
  console.log("Button Click")
  console.log(id,handle)
// token, items,products,productId,qty,options = { preventDuplicate: false }
  addToCart(userToken,userCartItems,productData,id,null, { preventDuplicate: handle })
};

  return (
    <div>
      <Header  hasHiddenAuthButtons={false}>
        
        <TextField
        className="search-desktop"
        size="small"
        onChange={(e)=>{debounceSearch(e.target.value,timerId)}}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Search color="primary" />
            </InputAdornment>
          ),
        }}
        placeholder="Search for items/categories"
        name="search"
      />

      </Header>

      {/* Search view for mobiles */}
      <TextField
        className="search-mobile"
        size="small"
        fullWidth
        onChange={(e)=>{debounceSearch(e.target.value,timerId)}}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Search color="primary" />
            </InputAdornment>
          ),
        }}
        placeholder="Search for items/categories"
        name="search"
      />

       <Grid container justifyContent="center" >
         <Grid item className="product-grid">
           <Box className="hero">
             <p className="hero-heading">
               India’s <span className="hero-highlight">FASTEST DELIVERY</span>{" "}
               to your door step
             </p>
           </Box>
         </Grid>
       </Grid>

      
      {
        isFetching?<div className={"loading"}>
                      <CircularProgress />
                      <h3>Loading Products</h3>
                    </div>
                  : !productNotFound?
                  <>
                  {
                    !userLoggedIn?
                    <Grid container >
                    <Grid container spacing={{ xs: 2, md: 3 ,lg:1 }} >
                      {productData.map((x)=>
                         (<Grid item lg={3} md={6} sm={6} xs={6} mt={2} mb={2} key={x['_id']}  >
                          <ProductCard product={x} handleAddToCart={(e)=>{addItems(e)}}/>
                        </Grid>
                        )
                        )}
                    </Grid>
                  </Grid>:
                        <Grid container  >
                        <Grid container spacing={{ xs: 2, md: 3 ,lg:1 }} md={9} >
                          {productData.map((x)=>
                             (<Grid item lg={4} md={4} sm={6} xs={6} mt={2} mb={2} key={x['_id']}  >
                              <ProductCard product={x} handleAddToCart={(e)=>{addItems(e)}}/>
                            </Grid>
                            )
                            )}
                        </Grid>
                        <Grid md={3} sm={12} xs={12} sx={{backgroundColor:'#E9F5E1'}} >
                           <Cart product={productData} items={cartData} handleQuantity={onButtonClick}  />
                           {/* handleQuantity={onButtonClick} */}
                        </Grid>
                      </Grid>
                  }
                  </>
                    :<div className={"loading"}>
                    <SentimentDissatisfied/>
                    <h3>No products found</h3>
                  </div>          
      }
      <Footer />
    </div>
  );
};

export default Products;
