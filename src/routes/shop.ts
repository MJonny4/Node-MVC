import express from 'express'

import {
    getCart,
    getCheckout,
    getOrders,
    getProduct,
    getProducts,
    getIndex,
    postCart,
    postCartDeleteProduct,
    getInvoice,
} from '../controllers/shop'
import isAuth from '../middleware/is-auth'

const router = express.Router()

router.get('/', getIndex)

router.get('/products', getProducts)

router.get('/products/:productId', getProduct)

router.get('/cart', isAuth, getCart)

router.post('/cart', isAuth, postCart)

router.post('/cart-delete-item', isAuth, postCartDeleteProduct)

router.get('/checkout', isAuth, getCheckout)

router.get('/orders', isAuth, getOrders)

router.get('/orders/:orderId', isAuth, getInvoice)

export default router
