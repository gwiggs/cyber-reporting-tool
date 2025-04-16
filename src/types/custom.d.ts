// React Redux types
declare module 'react-redux' {
  import { Store, Action } from 'redux';
  
  // Typed useDispatch and useSelector
  export function useDispatch<T = any>(): T;
  export function useSelector<TState = any, TSelected = any>(
    selector: (state: TState) => TSelected
  ): TSelected;
  
  export interface DispatchProp<A extends Action = Action> {
    dispatch: Dispatch<A>;
  }
  
  export function Provider(props: {
    store: Store;
    children: React.ReactNode;
  }): JSX.Element;
}

// React Router types
declare module 'react-router-dom' {
  export function BrowserRouter(props: {
    children: React.ReactNode;
  }): JSX.Element;
  
  export function Routes(props: {
    children: React.ReactNode;
  }): JSX.Element;
  
  export function Route(props: {
    path: string;
    element: React.ReactNode;
  }): JSX.Element;
  
  export function Navigate(props: {
    to: string;
  }): JSX.Element;
  
  export function useNavigate(): (path: string) => void;
}

// Redux Toolkit types
declare module '@reduxjs/toolkit' {
  export function configureStore(options: {
    reducer: any;
    middleware?: any;
    devTools?: boolean;
    preloadedState?: any;
    enhancers?: any[];
  }): any;
  
  export function createSlice(options: {
    name: string;
    initialState: any;
    reducers: any;
    extraReducers?: any;
  }): any;
  
  export function createAsyncThunk(
    typePrefix: string,
    payloadCreator: (...args: any[]) => Promise<any>,
    options?: any
  ): any;
  
  export type PayloadAction<P = void> = {
    payload: P;
    type: string;
  };
}

// Material UI types
declare module '@mui/material' {
  export const Button: any;
  export const TextField: any;
  export const Typography: any;
  export const Box: any;
  export const Card: any;
  export const CardContent: any;
  export const Alert: any;
  export const CircularProgress: any;
  export const MenuItem: any;
  export const Select: any;
  export const FormControl: any;
  export const InputLabel: any;
  export const FormHelperText: any;
  export const AppBar: any;
  export const Toolbar: any;
  export const Container: any;
  export const Grid: any;
  export const CssBaseline: any;
}

declare module '@mui/material/styles' {
  export function createTheme(options: any): any;
  export function ThemeProvider(props: {
    theme: any;
    children: React.ReactNode;
  }): JSX.Element;
}

// Form validation types
declare module 'formik' {
  export function useFormik(options: {
    initialValues: any;
    validationSchema?: any;
    onSubmit: (values: any) => void;
  }): any;
}

declare module 'yup' {
  export function object(schema: any): any;
  export function string(): any;
  export function email(message: string): any;
  export function required(message: string): any;
  export function min(min: number, message: string): any;
  export function oneOf(options: any[], message: string): any;
}

// Define window API interface
interface Window {
  api: {
    auth: {
      login: (credentials: { email: string; password: string }) => Promise<any>;
      register: (userData: { 
        email: string; 
        password: string; 
        firstName: string; 
        lastName: string; 
        role: string 
      }) => Promise<any>;
      logout: () => Promise<any>;
    }
  }
} 