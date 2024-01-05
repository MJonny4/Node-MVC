export type TUser = {
    email: string
    password: string
    resetToken: string
    resetTokenExpiration: Date
    cart: {
        items: [
            {
                productId: string
                quantity: number
            }
        ]
    }
}

export type TProduct = {
    title: string
    price: number
    description: string
    imageUrl: string
    _id: string
    userId: string
}

export type TOrder = {
    _id: string
    products: [
        {
            product: {
                _id: string
                title: string
                price: number
                description: string
                imageUrl: string
                userId: string
            }
            quantity: number
        }
    ]
    user: {
        email: string
        userId: string
    }
}
