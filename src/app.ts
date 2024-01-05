import path from 'path'
import fs from 'fs'

import express, { Request, Response, NextFunction } from 'express'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import session from 'express-session'
import MongoDBStore from 'connect-mongodb-session'
import csrf from 'csurf'
import flash from 'connect-flash'
import multer from 'multer'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'

import { get404, get500 } from './controllers/error'
import { postOrder } from './controllers/shop'
import isAuth from './middleware/is-auth'
import User from './models/user'

const MONGODB_URI: string | undefined = process.env.MONGODB_URI

const app = express()
const MongoDBStoreSession = MongoDBStore(session);

const store = new MongoDBStoreSession({
    uri: MONGODB_URI,
    collection: 'sessions',
})
const csrfProtection = csrf()

// const privateKey = fs.readFileSync("server.key");
// const certificate = fs.readFileSync("server.cert");

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    },
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

app.set('view engine', 'ejs')
app.set('views', 'views')

import adminRoutes from './routes/admin'
import shopRoutes from './routes/shop'
import authRoutes from './routes/auth'

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
)

app.use(helmet())
app.use(compression())
app.use(morgan('combined', { stream: accessLogStream }))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(
    multer({ storage: fileStorage, fileFilter: fileFilter }).single('image')
)
app.use(express.static(path.join(__dirname, 'public')))
app.use('/images', express.static(path.join(__dirname, 'images')))
app.use(
    session({
        secret: 'my secret',
        resave: false,
        saveUninitialized: false,
        store: store,
    })
)

app.use(flash())

app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.isAuthenticated = (req.session as any).isLoggedIn
    next()
})

app.use((req, res, next) => {
    // throw new Error('Sync Dummy');
    interface CustomRequest extends Request {
        user?: any
    }

    if (!(req.session as any).user) {
        return next()
    }
    User.findById((req.session as any).user._id)
        .then((user) => {
            if (!user) {
                return next()
            }
            ;(req as CustomRequest).user = user
            next()
        })
        .catch((err) => {
            next(new Error(err))
        })
})

app.post('/create-order', isAuth, postOrder)

app.use(csrfProtection)
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get('/500', get500)

app.use(get404)

app.use((error, req, res, next) => {
    // res.status(error.httpStatusCode).render(...);
    // res.redirect('/500');
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn,
    })
})

mongoose
    .connect(MONGODB_URI)
    .then((result) => {
        // https
        //     .createServer({ key: privateKey, cert: certificate }, app)
        //     .listen(process.env.PORT || 3000);
        app.listen(process.env.PORT || 3000)
    })
    .catch((err) => {
        console.log(err)
    })
