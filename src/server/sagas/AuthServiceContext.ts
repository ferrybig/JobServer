import { makeSagaContext } from '../../common/sagas/effects';
import AuthService from '../AuthService';

export default makeSagaContext<AuthService>('AuthService');
