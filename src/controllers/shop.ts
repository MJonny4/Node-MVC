import fs from 'fs'
import path from 'path'

import PDFDocument from 'pdfkit'
const stripe = require('stripe')(process.env.STRIPE_KEY)

import Product from '../models/product'
import Order from '../models/order'
import { Document, Types } from 'mongoose'

const ITEMS_PER_PAGE = 2
type ErrorCustom = Error & { httpStatusCode: number }

export const getProducts = (
    req: { query: { page: string | number } },
    res: {
        render: (
            arg0: string,
            arg1: {
                prods: (Document<
                    unknown,
                    {},
                    {
                        userId: Types.ObjectId
                        description: string
                        price: number
                        title: string
                        imageUrl: string
                    }
                > & {
                    userId: Types.ObjectId
                    description: string
                    price: number
                    title: string
                    imageUrl: string
                } & { _id: Types.ObjectId })[]
                pageTitle: string
                path: string
                currentPage: number
                hasNextPage: boolean
                hasPreviousPage: boolean
                nextPage: number
                previousPage: number
                lastPage: number
            }
        ) => void
    },
    next: (arg0: Error) => any
) => {
    const page = +req.query.page || 1
    let totalItems: number

    Product.find()
        .countDocuments()
        .then((numProducts) => {
            totalItems = numProducts
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            })
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const getProduct = (req, res, next) => {
    const prodId = req.params.productId
    Product.findById(prodId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products',
            })
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const getIndex = (req, res, next) => {
    const page = +req.query.page || 1
    let totalItems

    Product.find()
        .countDocuments()
        .then((numProducts) => {
            totalItems = numProducts
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then((products) => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
            })
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const getCart = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        // .execPopulate()
        .then((user) => {
            const products = user.cart.items
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products,
            })
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const postCart = (req, res, next) => {
    const prodId = req.body.productId
    Product.findById(prodId)
        .then((product) => {
            return req.user.addToCart(product)
        })
        .then((result) => {
            // console.log(result);
            res.redirect('/cart')
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId
    req.user
        .removeFromCart(prodId)
        .then((result) => {
            res.redirect('/cart')
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const getCheckout = (req, res, next) => {
    req.user
        .populate('cart.items.productId')
        // .execPopulate()
        .then((user) => {
            const products = user.cart.items
            let total = 0
            products.forEach((p) => {
                total += p.quantity * p.productId.price
            })
            res.render('shop/checkout', {
                path: '/checkout',
                pageTitle: 'Checkout',
                products: products,
                totalSum: total,
            })
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const postOrder = (req, res, next) => {
    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const token = req.body.stripeToken // Using Express
    let totalSum = 0

    req.user
        .populate('cart.items.productId')
        // .execPopulate()
        .then((user) => {
            user.cart.items.forEach((p) => {
                totalSum += p.quantity * p.productId.price
            })

            const products = user.cart.items.map((i) => {
                return {
                    quantity: i.quantity,
                    product: { ...i.productId._doc },
                }
            })
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user,
                },
                products: products,
            })
            return order.save()
        })
        .then((result) => {
            const charge = stripe.charges.create({
                amount: totalSum * 100,
                currency: 'usd',
                description: 'Demo Order',
                source: token,
                metadata: { order_id: result._id.toString() },
            })
            return req.user.clearCart()
        })
        .then(() => {
            res.redirect('/orders')
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.user._id })
        .then((orders) => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders,
            })
        })
        .catch((err) => {
            const error = new Error(err) as ErrorCustom
            error.httpStatusCode = 500
            return next(error)
        })
}

export const getInvoice = (req, res, next) => {
    const orderId = req.params.orderId
    Order.findById(orderId)
        .then((order) => {
            if (!order) {
                return next(new Error('No order found.'))
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'))
            }
            const invoiceName = 'invoice-' + orderId + '.pdf'
            const invoicePath = path.join('data', 'invoices', invoiceName)

            const pdfDoc = new PDFDocument()
            res.setHeader('Content-Type', 'application/pdf')
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceName + '"'
            )
            pdfDoc.pipe(fs.createWriteStream(invoicePath))
            pdfDoc.pipe(res)

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true,
            })
            pdfDoc.text('-----------------------')
            let totalPrice = 0
            order.products.forEach((prod) => {
                totalPrice += prod.quantity * prod.product.price
                pdfDoc
                    .fontSize(14)
                    .text(
                        prod.product.title +
                            ' - ' +
                            prod.quantity +
                            ' x ' +
                            '$' +
                            prod.product.price
                    )
            })
            pdfDoc.text('---')
            pdfDoc.fontSize(20).text('Total Price: $' + totalPrice)

            pdfDoc.end()
            // fs.readFile(invoicePath, (err, data) => {
            //   if (err) {
            //     return next(err);
            //   }
            //   res.setHeader('Content-Type', 'application/pdf');
            //   res.setHeader(
            //     'Content-Disposition',
            //     'inline; filename="' + invoiceName + '"'
            //   );
            //   res.send(data);
            // });
            // const file = fs.createReadStream(invoicePath);

            // file.pipe(res);
        })
        .catch((err) => next(err))
}
