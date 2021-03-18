import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    console.log(storagedCart);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);

      const stock = await api.get(`stock/${productId}`);
      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;


      const amount = currentAmount + 1;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productExists) {
        updateProductAmount({ productId: productExists.id, amount })
      } else {
        const response = await api.get(`products/${productId}`);
        const data: Product = {
          ...response.data,
          amount: 1,
        }
        setCart([...cart, data]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, data]));
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productExists = cart.find(product => product.id === productId);

      if (productExists) {
        const cartFiltered = cart.filter(product => product.id !== productId);
        setCart(cartFiltered);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartFiltered));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
      return;
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return;
      const productExists = cart.find(product => product.id === productId);

      if (productExists) {
        const stock = await api.get(`stock/${productId}`);

        if (amount > stock.data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }


        const amountUpdated = cart.map(product => product.id === productId ? {
          ...product,
          amount: amount,
        } : product)

        setCart(amountUpdated);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(amountUpdated));
      } else {
      toast.error('Erro na alteração de quantidade do produto');
        return;
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
