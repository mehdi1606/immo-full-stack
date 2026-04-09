package com.clubicode.mmomarocback.entity;

import com.clubicode.mmomarocback.enums.PropertyStatus;
import com.clubicode.mmomarocback.enums.PropertyType;
import com.clubicode.mmomarocback.enums.Purpose;
import com.clubicode.mmomarocback.enums.SubPurpose;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "properties")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(of = {"id", "title", "type", "city", "status"})
@EqualsAndHashCode(of = "id")
public class Property {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PropertyType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Purpose purpose;

    /** Sub-category: NEUF/OCCASION for VENTE, COURT_TERME/LONG_TERME for LOCATION */
    @Enumerated(EnumType.STRING)
    private SubPurpose subPurpose;

    @Column(nullable = false)
    private String city;

    private String neighborhood;

    @Column(nullable = false)
    private Double price;

    private Double area;
    private Integer rooms;
    private Integer bathrooms;
    private Integer floor;

    @Builder.Default
    private Boolean parking = false;

    @Builder.Default
    private Boolean elevator = false;

    @Builder.Default
    private Boolean furnished = false;

    @Builder.Default
    private Boolean featured = false;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private PropertyStatus status = PropertyStatus.DISPONIBLE;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Long views = 0L;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Timestamp recorded when status changes to VENDU or LOUE.
     * Used to detect listings that have been sold/rented for > 30 days.
     */
    private LocalDateTime statusChangedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private Agent agent;

    @OneToMany(mappedBy = "property", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PropertyImage> images = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "property_features", joinColumns = @JoinColumn(name = "property_id"))
    @Column(name = "feature")
    @Builder.Default
    private Set<String> features = new LinkedHashSet<>();
}
