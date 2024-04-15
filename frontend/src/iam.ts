// import { InjectionKey, Plugin } from 'vue';
// import Keycloak, { KeycloakConfig } from 'keycloak-js';
import { App, InjectionKey, Plugin } from 'vue';
import Keycloak from 'keycloak-js';
import { Biscuit, PublicKey } from '@biscuit-auth/biscuit-wasm';

import http from '@/http';
import type { components } from '@/types';
import { useRouter } from 'vue-router';

type definitions = components['schemas'];
type LoginResponse = definitions['LoginResponse'];
type InstanceConfig = definitions['InstanceConfig'];

export const keycloakKey = Symbol() as InjectionKey<Keycloak>; // FIXME

interface Tokens {
  accessToken: string;
  accessTokenExpiration: Date;
  refreshToken: string;
  refreshTokenExpiration: Date;
}

const localStorageKey = 'auth';

let tokens: Tokens | null = null;

function readTokensFromStorage(): Tokens | null {
  const data = window.localStorage.getItem(localStorageKey);

  if (data !== null) {
    const parsed = JSON.parse(data) as {
      accessToken: string;
      accessTokenExpiration: string;
      refreshToken: string;
      refreshTokenExpiration: string;
    } | null;

    if (parsed !== null) {
      return {
        ...parsed,
        accessTokenExpiration: new Date(parsed.accessTokenExpiration),
        refreshTokenExpiration: new Date(parsed.refreshTokenExpiration),
      };
    } else {
      return null;
    }
  } else {
    return null;
  }
}

function writeTokensToStorage(tokens: Tokens): void {
  window.localStorage.setItem(localStorageKey, JSON.stringify(tokens));
}

// function getParams(): string | KeycloakConfig {
//   if (import.meta.env.VITE_KEYCLOAK_URL) {
//     return {
//       url: import.meta.env.VITE_KEYCLOAK_URL,
//       realm: import.meta.env.VITE_KEYCLOAK_REALM ?? '',
//       clientId: import.meta.env.VITE_KEYCLOAK_FRONT_CLIENT_ID ?? '',
//     };
//   }
//   return '/keycloak.json';
// }

// const keycloak = new Keycloak(getParams());

// keycloak.onTokenExpired = () => {
//   void onTokenExpired();
// };

export function onTokenExpired() {
  // return keycloak.updateToken(3600).catch(async (_err) => {
  //   console.error(_err);
  //   return keycloak.login();
  // });
  return Promise.resolve();
}

// const auth$ = keycloak.init({
//   onLoad: 'login-required',
//   redirectUri: window.location.href,
//   enableLogging: import.meta.env.NODE_ENV !== 'production',
//   checkLoginIframe: false,
// });

// export const KeycloakPlugin: Plugin = {
//   install: (app, _options) => {
//     app.provide(keycloakKey, keycloak);
//   },
// };

export interface KeycloakTokenParsedAttributes {
  email: string;
}

export function getToken(): Promise<string> {
  console.log('getToken', tokens);
  // return auth$.then((auth) => {
  //   if (!auth) {
  //     window.location.reload();
  //   }

  //   return keycloak.token as string;
  // });
  return Promise.resolve('00000000-0000-0000-0000-000000000000');
}

export const AuthPlugin: Plugin = {
  install(app: App, _options: unknown) {
    const storedTokens = readTokensFromStorage();
    if (storedTokens !== null) {
      tokens = storedTokens;
    } else {
      const router = useRouter();
      router.push('/login').catch(console.error);
    }

    app.config.globalProperties.$auth = {};
  },
};

export async function init() {
  const { biscuit_public_key } = await http.unauthenticated
    .get<InstanceConfig>('/instance')
    .then((res) => res.data);
  const public_key = PublicKey.fromString(biscuit_public_key);
  console.log(public_key);

  const { access_token } = await http.unauthenticated
    .post<LoginResponse>('/auth/login', {
      email: 'david.sferruzza@gmail.com',
      password: 'david',
    })
    .then((res) => res.data);
  console.log(access_token);

  const biscuit = Biscuit.fromBase64(access_token, public_key);
  console.log(biscuit.toString());
}
