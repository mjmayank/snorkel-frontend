import React, { useEffect } from 'react';
import Link from "next/link";
import { toaster } from 'evergreen-ui';

import styles from "components/LoginPage/LoginPage.module.css";
//uses borrowed styling
import Layout from "components/Layout/Layout";
import BackgroundCard from "components/Layout/BackgroundCard/BackgroundCard";
import SignupInput from 'components/SignupInput';
import PrimaryButton from 'components/PrimaryButton';
import { clientSideDomain } from 'lib/constants';
import { sendEvent } from 'hooks/amplitude';
import { useCurrentUser } from 'context/usercontext';

const CreateAccount = (props) => {
    const [password, setPassword] = React.useState('')
    const { state } = useCurrentUser();

    const registerUser = () => {
        const body = {
            password,
            'user_id': state.user.id,
        }
        fetch(`${clientSideDomain}/user/register/password`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            response.json().then(data => {
                if (response.ok) {
                    if (data.auth_token) {
                        sendEvent('partial_register_password_success');
                        if (data.username) {
                            window.location.href = "/";
                        } else {
                            window.location.href = "/setusername"
                        }
                    } else {
                        sendEvent('partial_register_password_error');
                    }
                } else {
                    sendEvent('partial_register_password_error');
                    toaster.danger(data.msg);
                }
            })
        })
    }

    useEffect(() => {
        sendEvent('register_begin');
    }, [])

    return (
        <Layout>
            <BackgroundCard>
                <div className={styles.titlecontainer}>
                    Finish creating your account by setting a password
                </div>
                <form onSubmit={ e => {e.preventDefault();}}>
                    <SignupInput value={password} onChange={ setPassword } id='password-input' type="Password"></SignupInput>
                    <PrimaryButton onClick={ registerUser }>Create Account</PrimaryButton>
                </form>
            </BackgroundCard>
        </Layout>
    )
}

CreateAccount.setInitialProps = (context) => {
  { userId: context.query.userid }
}

export default CreateAccount;