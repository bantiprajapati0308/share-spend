import { useEffect, useState } from "react";
import { CancelButton, DeleteButton, PrimaryButton } from "./Button";
import { Modal } from "react-bootstrap";


export const modalWrapper = (Component, intialProps) => {
    return props => {
        return <Component {...props} {...intialProps} />
    }
}
export const CustomModal = ({ modalType, ...props }) => {
    const { modalHeader, onClick, showModal, setShowModal, ...rest } = props;
    useEffect(() => {
        setShowModal(showModal)

        // return () =>  setShowModal(false) 
    }, [showModal])
    const buttonUI = () => {
        if (modalType === ('Delete' || 'Confirm')) {
            return <>
                <CancelButton text="Cancel" onClick={() => setShowModal(false)} />
                {modalType === 'Delete' ? <DeleteButton onClick={onClick} text={modalType} /> : <PrimaryButton onClick={onClick} text={modalType} />}
            </>
        } else {
            return < PrimaryButton text={modalType} />
        }
    }



    return <>
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {modalHeader}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {props.children}
            </Modal.Body>
            <Modal.Footer>
                {buttonUI()}
            </Modal.Footer>
        </Modal>
    </>
}

export const DeleteModal = modalWrapper(CustomModal, { modalType: 'Delete' })
export const OkModal = modalWrapper(CustomModal, { modalType: 'Ok' })