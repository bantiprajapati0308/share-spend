import { Button } from "react-bootstrap"

export const buttonWrapper = (Component, initialProps) => {
    return props => {
        return <Component {...props} {...initialProps} />
    }
}

export const CustomButton = ({ text, ...props }) => {

    return <Button {...props} >
        {text}
    </Button>
}

export const FullWidthPrimaryButton = buttonWrapper(CustomButton, { variant: "success", style: { width: "100%" } })
export const PrimaryButton = buttonWrapper(CustomButton, { variant: "success" })
export const DeleteButton = buttonWrapper(CustomButton, { variant: "danger" })
export const CancelButton = buttonWrapper(CustomButton, { variant: "secondary" })
