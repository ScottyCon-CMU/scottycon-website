import ActivityGroup from '../components/ActivityGroup'
import { type ActivityGroupData, activitygroups } from '../data/activities'

function Activities() {
  return (
    <section>
      {/* TODO: list panels, events, and schedule */}
      <h1>Activities</h1>
      <p>
        Explore everything you can do at ScottyCon!
      </p>
      {
        activitygroups.map((data: ActivityGroupData) => (
          <ActivityGroup
            name={data.name}
            time = {data.time}
            description = {data.description}
          />
        ))
      }
    </section>
  )
}

export default Activities
