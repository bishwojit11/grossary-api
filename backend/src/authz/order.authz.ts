import {
  AbilityBuilder,
  AbilityClass,
  AbilityTuple,
  AnyAbility,
  buildMongoQueryMatcher,
  MongoQuery,
  PureAbility,
} from '@casl/ability';
import { Role } from '@prisma/client';
import { AbilityAction } from '../enums';
import { ISession } from './session.types';

export class OrderAuthZEntity {
  public readonly userId: string | null;

  constructor({ userId }: { userId?: string | null }) {
    this.userId = userId ?? null;
  }
}

type OrderAbility = PureAbility<
  AbilityTuple,
  MongoQuery<typeof OrderAuthZEntity>
>;
const OrderAbilityClass = PureAbility as AbilityClass<OrderAbility>;

export class OrderAbilityBuilder {
  private abilityBuilder: AbilityBuilder<OrderAbility>;
  private session: ISession;

  constructor(session: ISession) {
    this.abilityBuilder = new AbilityBuilder(OrderAbilityClass);
    this.session = session;
  }

  getAbility(): AnyAbility {
    const builder = this.abilityBuilder;
    const uid = this.session.user.id;

    if (this.session.user.role === Role.USER) {
      builder.can(AbilityAction.Create, OrderAuthZEntity, {
        userId: uid,
      });
      builder.can(AbilityAction.Read, OrderAuthZEntity, {
        userId: uid,
      });
    }

    if (this.session.user.role === Role.ADMIN) {
      builder.can(AbilityAction.Read, OrderAuthZEntity);
    }

    return builder.build({
      conditionsMatcher: buildMongoQueryMatcher(),
    });
  }
}
