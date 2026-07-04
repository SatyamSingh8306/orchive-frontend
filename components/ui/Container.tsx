import { ReactNode } from 'react';

type ContainerProps = {
    children: ReactNode;
    className?: string;
};

const Container = ({ children, className = '' }: ContainerProps) => {
    return (
        <div className={`mx-auto w-full max-w-[1320px] px-6 sm:px-10 lg:px-16 ${className}`}>
            {children}
        </div>
    );
};

export default Container;
