import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { DummyJsonUserService } from './dummyjson-user.service';

describe('DummyJsonUserService', () => {
  let service: DummyJsonUserService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(DummyJsonUserService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    TestBed.resetTestingModule();
  });

  it('loads user records without retaining sensitive API fields', async () => {
    const loading = service.loadUsers();
    const request = httpTesting.expectOne('https://dummyjson.com/users?limit=0');
    expect(request.request.method).toBe('GET');
    request.flush({
      users: [{
        id: 1,
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@x.dummyjson.com',
        username: 'emilys',
        phone: '555-0100',
        image: 'https://dummyjson.com/icon/emilys/128',
        role: 'admin',
        maidenName: 'Smith',
        age: 28,
        gender: 'female',
        birthDate: '1996-5-30',
        height: 193.24,
        address: {
          address: '626 Main Street',
          city: 'Phoenix',
          state: 'Mississippi',
          stateCode: 'MS',
          postalCode: '29112',
          coordinates: { lat: -77.16213, lng: -92.084824 },
          country: 'United States'
        },
        bank: {
          cardExpire: '03/26',
          cardNumber: '9289760655481815',
          cardType: 'Elo',
          currency: 'CNY',
          iban: 'YPUXISOBI7TTHPK2BR3HAIXL'
        },
        ssn: '900-590-289',
        password: 'do-not-retain',
        crypto: { coin: 'Bitcoin', wallet: '0xb9fc2fe63b2a6c003f1c324c3bfa53259162181a', network: 'Ethereum' }
      }],
      total: 208,
      skip: 0,
      limit: 0
    });

    await loading;
    expect(service.users()).toEqual([{
      id: 1,
      firstName: 'Emily',
      lastName: 'Johnson',
      email: 'emily.johnson@x.dummyjson.com',
      username: 'emilys',
      phone: '555-0100',
      image: 'https://dummyjson.com/icon/emilys/128',
      role: 'admin',
      maidenName: 'Smith',
      age: 28,
      gender: 'female',
      birthDate: '1996-5-30',
      height: 193.24,
      address: {
        address: '626 Main Street',
        city: 'Phoenix',
        state: 'Mississippi',
        stateCode: 'MS',
        postalCode: '29112',
        coordinates: { lat: -77.16213, lng: -92.084824 },
        country: 'United States'
      },
      bank: {
        cardExpire: '03/26',
        cardNumber: '•••• 1815',
        cardType: 'Elo',
        currency: 'CNY',
        iban: '•••• AIXL'
      },
      ssn: '•••-••-0289',
      crypto: { coin: 'Bitcoin', wallet: '•••• 181a', network: 'Ethereum' }
    }]);
    expect(service.total()).toBe(208);
    expect(JSON.stringify(service.users())).not.toContain('do-not-retain');
    expect(JSON.stringify(service.users())).not.toContain('9289760655481815');
    expect(JSON.stringify(service.users())).not.toContain('900-590-289');
    expect(JSON.stringify(service.users())).not.toContain('0xb9fc2fe63b2a6c003f1c324c3bfa53259162181a');
  });

  it('creates, updates, and deletes API users', async () => {
    const loading = service.loadUsers();
    httpTesting.expectOne('https://dummyjson.com/users?limit=0').flush({
      users: [{
        id: 1,
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@x.dummyjson.com',
        username: 'emilys',
        role: 'user'
      }],
      total: 208,
      skip: 0,
      limit: 0
    });
    await loading;

    const input = {
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      username: 'alexm',
      password: 'password123',
      role: 'user' as const
    };
    const creating = service.createUser(input);
    const createRequest = httpTesting.expectOne('https://dummyjson.com/users/add');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(input);
    createRequest.flush({ id: 101, ...input, phone: '', image: '' });
    const created = await creating;
    expect(created.id).toBe(101);
    expect(service.total()).toBe(209);

    const updating = service.updateUser(101, { ...input, firstName: 'Updated Alex' });
    const updateRequest = httpTesting.expectOne('https://dummyjson.com/users/101');
    expect(updateRequest.request.method).toBe('PATCH');
    expect(updateRequest.request.body).not.toHaveProperty('password');
    updateRequest.flush({
      id: 101,
      firstName: 'Updated Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      username: 'alexm',
      role: 'user'
    });
    await updating;
    expect(service.users()[0].firstName).toBe('Updated Alex');

    const deleting = service.deleteUser(101);
    const deleteRequest = httpTesting.expectOne('https://dummyjson.com/users/101');
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ id: 101, isDeleted: true, deletedOn: '2026-10-17T10:00:00.000Z' });
    await deleting;
    expect(service.users().map(user => user.id)).toEqual([1]);
    expect(service.total()).toBe(208);
  });

  it('searches users across all fields and filters nested API fields', async () => {
    const search = service.searchUsers('Brown');
    const searchRequest = httpTesting.expectOne('https://dummyjson.com/users/search?q=Brown');
    expect(searchRequest.request.method).toBe('GET');
    searchRequest.flush({
      users: [{
        id: 1,
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@x.dummyjson.com',
        username: 'emilys',
        role: 'user',
        hair: { color: 'Brown', type: 'Curly' }
      }],
      total: 23,
      skip: 0,
      limit: 23
    });
    expect((await search)[0].hair?.color).toBe('Brown');

    const filter = service.searchUsers('Brown', 'hair.color');
    const filterRequest = httpTesting.expectOne('https://dummyjson.com/users/filter?key=hair.color&value=Brown');
    expect(filterRequest.request.method).toBe('GET');
    filterRequest.flush({
      users: [{
        id: 1,
        firstName: 'Emily',
        lastName: 'Johnson',
        email: 'emily.johnson@x.dummyjson.com',
        username: 'emilys',
        role: 'user',
        hair: { color: 'Brown', type: 'Curly' }
      }],
      total: 23,
      skip: 0,
      limit: 23
    });
    expect((await filter)[0].hair?.color).toBe('Brown');
  });
});
