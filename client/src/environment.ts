// Webpack DefinePlugin
declare const environment: {
    NODE_ENV: string;
    PORT: string;
    HOST: string;
};

const environmental = environment;

export { environmental as environment };
