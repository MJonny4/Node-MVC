import express from 'express'
import { body } from 'express-validator'

import {
    deleteProduct,
    getAddProduct,
    getEditProduct,
    getProducts,
    postAddProduct,
    postEditProduct,
} from '../controllers/admin'
import isAuth from '../middleware/is-auth'

const router = express.Router()

// /admin/add-product => GET
router.get('/add-product', isAuth, getAddProduct)

// /admin/products => GET
router.get('/products', isAuth, getProducts)

// /admin/add-product => POST
router.post(
    '/add-product',
    [
        body('title').isString().isLength({ min: 3 }).trim(),
        body('price').isFloat(),
        body('description').isLength({ min: 5, max: 400 }).trim(),
    ],
    isAuth,
    postAddProduct
)

router.get('/edit-product/:productId', isAuth, getEditProduct)

router.post(
    '/edit-product',
    [
        body('title').isString().isLength({ min: 3 }).trim(),
        body('price').isFloat(),
        body('description').isLength({ min: 5, max: 400 }).trim(),
    ],
    isAuth,
    postEditProduct
)

router.delete('/product/:productId', isAuth, deleteProduct)

export default router
