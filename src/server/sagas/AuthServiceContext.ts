import { makeSagaContext } from '../../common/utils/effects';
import AuthService from '../AuthService';

export default makeSagaContext<AuthService>('AuthService');
