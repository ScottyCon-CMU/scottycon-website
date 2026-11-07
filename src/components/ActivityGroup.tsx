import { type ActivityGroupData } from "../data/activities" 

function ActivityGroup({name, time, description, image}: ActivityGroupData) {
  return (
    <section className="activitygroup">
        <h2>{name}</h2>
        <h3>{time}</h3>
        <p>{description}</p>
        {image && <img src={image} alt={name} />}
    </section>
  )
}

export default ActivityGroup
